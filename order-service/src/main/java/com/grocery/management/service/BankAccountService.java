package com.grocery.management.service;

import com.grocery.management.entity.BankAccount;
import java.util.List;

public interface BankAccountService {
    List<BankAccount> getAllAccounts();

    BankAccount getAccountById(Long id);

    BankAccount createAccount(BankAccount bankAccount);

    BankAccount updateAccount(Long id, BankAccount bankAccount);

    void deleteAccount(Long id);
}
