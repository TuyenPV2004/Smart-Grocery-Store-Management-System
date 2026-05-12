package com.grocery.management.service;

import com.grocery.management.config.VNPayConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.TimeZone;

@Service
@RequiredArgsConstructor
public class VNPayService {

    private final VNPayConfig vnPayConfig;

    public String createPaymentUrl(String orderCode, long amount, String ipAddress, LocalDateTime expiresAt)
            throws UnsupportedEncodingException {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_Version", vnPayConfig.getVersion());
        params.put("vnp_Command", vnPayConfig.getCommand());
        params.put("vnp_TmnCode", vnPayConfig.getTmnCode());
        params.put("vnp_Amount", String.valueOf(amount * 100));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", orderCode);
        params.put("vnp_OrderInfo", "Thanh toan don hang: " + orderCode);
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", vnPayConfig.getReturnUrl());
        params.put("vnp_IpAddr", ipAddress);

        Calendar calendar = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        params.put("vnp_CreateDate", formatter.format(calendar.getTime()));

        if (expiresAt != null) {
            Calendar expireCalendar = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
            expireCalendar.set(expiresAt.getYear(), expiresAt.getMonthValue() - 1, expiresAt.getDayOfMonth(),
                    expiresAt.getHour(), expiresAt.getMinute(), expiresAt.getSecond());
            params.put("vnp_ExpireDate", formatter.format(expireCalendar.getTime()));
        } else {
            calendar.add(Calendar.MINUTE, 15);
            params.put("vnp_ExpireDate", formatter.format(calendar.getTime()));
        }

        List<String> fieldNames = new ArrayList<>(params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator<String> iterator = fieldNames.iterator();
        while (iterator.hasNext()) {
            String fieldName = iterator.next();
            String fieldValue = params.get(fieldName);
            if (fieldValue != null && !fieldValue.isBlank()) {
                hashData.append(fieldName)
                        .append('=')
                        .append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString()))
                        .append('=')
                        .append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                if (iterator.hasNext()) {
                    hashData.append('&');
                    query.append('&');
                }
            }
        }

        String secureHash = VNPayConfig.hmacSHA512(vnPayConfig.getHashSecret(), hashData.toString());
        return vnPayConfig.getPayUrl() + "?" + query + "&vnp_SecureHash=" + secureHash;
    }

    public boolean validatePaymentReturn(Map<String, String> fields) {
        String secureHash = fields.get("vnp_SecureHash");
        fields.remove("vnp_SecureHashType");
        fields.remove("vnp_SecureHash");

        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        Iterator<String> iterator = fieldNames.iterator();
        while (iterator.hasNext()) {
            String fieldName = iterator.next();
            String fieldValue = fields.get(fieldName);
            if (fieldValue != null && !fieldValue.isBlank()) {
                hashData.append(fieldName)
                        .append('=')
                        .append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                if (iterator.hasNext()) {
                    hashData.append('&');
                }
            }
        }
        String signValue = VNPayConfig.hmacSHA512(vnPayConfig.getHashSecret(), hashData.toString());
        return signValue.equals(secureHash);
    }
}
