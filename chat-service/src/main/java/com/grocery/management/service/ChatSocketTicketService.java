package com.grocery.management.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ChatSocketTicketService {

    private static final long TICKET_TTL_SECONDS = 120;

    private final Map<String, TicketState> tickets = new ConcurrentHashMap<>();

    public TicketIssueResult issueAuthenticatedTicket(String userKey, String displayName, String role) {
        cleanupExpiredTickets();
        String ticket = UUID.randomUUID().toString();
        tickets.put(ticket, new TicketState(new ChatSocketPrincipal(userKey, displayName, role), Instant.now().plusSeconds(TICKET_TTL_SECONDS)));
        return new TicketIssueResult(ticket, null, null, true);
    }

    public TicketIssueResult issueGuestTicket(String guestToken, String guestDisplayName) {
        cleanupExpiredTickets();

        String normalizedGuestToken = normalizeGuestToken(guestToken);
        String normalizedDisplayName = normalizeGuestDisplayName(guestDisplayName, normalizedGuestToken);
        String ticket = UUID.randomUUID().toString();

        tickets.put(
                ticket,
                new TicketState(
                        new ChatSocketPrincipal("guest-" + normalizedGuestToken, normalizedDisplayName, "GUEST"),
                        Instant.now().plusSeconds(TICKET_TTL_SECONDS)
                )
        );

        return new TicketIssueResult(ticket, normalizedGuestToken, normalizedDisplayName, false);
    }

    public ChatSocketPrincipal consumeTicket(String ticket) {
        if (ticket == null || ticket.isBlank()) {
            return null;
        }

        cleanupExpiredTickets();
        TicketState state = tickets.remove(ticket);
        if (state == null || state.expiresAt().isBefore(Instant.now())) {
            return null;
        }
        return state.principal();
    }

    private void cleanupExpiredTickets() {
        Instant now = Instant.now();
        tickets.entrySet().removeIf(entry -> entry.getValue().expiresAt().isBefore(now));
    }

    private String normalizeGuestToken(String guestToken) {
        String cleaned = guestToken == null ? "" : guestToken.replaceAll("[^a-zA-Z0-9_-]", "");
        if (!cleaned.isBlank()) {
            return cleaned;
        }
        return "guest_" + UUID.randomUUID().toString().replace("-", "");
    }

    private String normalizeGuestDisplayName(String guestDisplayName, String guestToken) {
        String cleaned = guestDisplayName == null ? "" : guestDisplayName.trim().replaceAll("\\s+", " ");
        if (!cleaned.isBlank()) {
            return cleaned;
        }
        String suffix = guestToken.length() > 6 ? guestToken.substring(guestToken.length() - 6) : guestToken;
        return "Khach " + suffix.toUpperCase();
    }

    public record ChatSocketPrincipal(String userKey, String displayName, String role) {
        public boolean isStaff() {
            return "ADMIN".equals(role) || "STAFF".equals(role);
        }
    }

    public record TicketIssueResult(
            String ticket,
            String guestToken,
            String guestDisplayName,
            boolean authenticated
    ) {
    }

    private record TicketState(ChatSocketPrincipal principal, Instant expiresAt) {
    }
}
