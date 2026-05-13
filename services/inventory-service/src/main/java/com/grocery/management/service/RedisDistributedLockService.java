package com.grocery.management.service;

import com.grocery.management.exception.InventoryLockException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RedisDistributedLockService {
    private static final DefaultRedisScript<Long> RELEASE_SCRIPT = new DefaultRedisScript<>("""
            if redis.call('get', KEYS[1]) == ARGV[1] then
                return redis.call('del', KEYS[1])
            end
            return 0
            """, Long.class);

    private final StringRedisTemplate redisTemplate;

    @Value("${app.locking.redis.key-prefix:grocery:inventory:lock:}")
    private String keyPrefix;

    @Value("${app.locking.redis.wait-timeout:5s}")
    private Duration waitTimeout;

    @Value("${app.locking.redis.retry-interval:50ms}")
    private Duration retryInterval;

    @Value("${app.locking.redis.lease-time:30s}")
    private Duration leaseTime;

    public List<LockLease> lockAll(Collection<String> keys) {
        List<String> sortedKeys = keys.stream()
                .filter(key -> key != null && !key.isBlank())
                .distinct()
                .sorted(Comparator.naturalOrder())
                .toList();

        List<LockLease> leases = new ArrayList<>();
        try {
            for (String key : sortedKeys) {
                leases.add(lock(key));
            }
            return leases;
        } catch (RuntimeException ex) {
            releaseAll(leases);
            throw ex;
        }
    }

    public LockLease lock(String key) {
        String redisKey = keyPrefix + key;
        String token = UUID.randomUUID().toString();
        long deadline = System.nanoTime() + waitTimeout.toNanos();

        while (System.nanoTime() <= deadline) {
            Boolean locked = redisTemplate.opsForValue().setIfAbsent(redisKey, token, leaseTime);
            if (Boolean.TRUE.equals(locked)) {
                return new LockLease(redisKey, token);
            }
            sleepQuietly(retryInterval);
        }

        throw new InventoryLockException("Khong the lay khoa Redis cho tai nguyen: " + key);
    }

    public void releaseAfterTransaction(List<LockLease> leases) {
        if (leases == null || leases.isEmpty()) {
            return;
        }
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            releaseAll(leases);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                releaseAll(leases);
            }
        });
    }

    private void releaseAll(List<LockLease> leases) {
        for (int i = leases.size() - 1; i >= 0; i--) {
            leases.get(i).release();
        }
    }

    private void sleepQuietly(Duration duration) {
        try {
            Thread.sleep(Math.max(1, duration.toMillis()));
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new InventoryLockException("Bi gian doan khi cho Redis lock", ex);
        }
    }

    public class LockLease {
        private final String redisKey;
        private final String token;

        private LockLease(String redisKey, String token) {
            this.redisKey = redisKey;
            this.token = token;
        }

        public void release() {
            redisTemplate.execute(RELEASE_SCRIPT, List.of(redisKey), token);
        }
    }
}
