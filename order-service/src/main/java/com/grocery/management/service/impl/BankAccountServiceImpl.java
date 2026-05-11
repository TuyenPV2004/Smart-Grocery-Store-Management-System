package com.grocery.management.service.impl;

import com.grocery.management.entity.BankAccount;
import com.grocery.management.repository.BankAccountRepository;
import com.grocery.management.service.BankAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BankAccountServiceImpl implements BankAccountService {

    private final BankAccountRepository bankAccountRepository;

    @Override
    public List<BankAccount> getAllAccounts() {
        return bankAccountRepository.findAll();
    }

    @Override
    public BankAccount getAccountById(Long id) {
        return bankAccountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản ngân hàng"));
    }

    @Override
    @Transactional
    public BankAccount createAccount(BankAccount bankAccount) {
        if (bankAccountRepository.existsByAccountNumber(bankAccount.getAccountNumber())) {
            throw new RuntimeException("Số tài khoản đã tồn tại");
        }
        return bankAccountRepository.save(bankAccount);
    }

    @Override
    @Transactional
    public BankAccount updateAccount(Long id, BankAccount updatedAccount) {
        BankAccount existingAccount = getAccountById(id);

        if (!existingAccount.getAccountNumber().equals(updatedAccount.getAccountNumber()) &&
                bankAccountRepository.existsByAccountNumber(updatedAccount.getAccountNumber())) {
            throw new RuntimeException("Số tài khoản đã tồn tại");
        }

        existingAccount.setBankName(updatedAccount.getBankName());
        existingAccount.setBrand(updatedAccount.getBrand());
        existingAccount.setAccountNumber(updatedAccount.getAccountNumber());
        existingAccount.setAccountOwner(updatedAccount.getAccountOwner());
        if (updatedAccount.getStatus() != null) {
            existingAccount.setStatus(updatedAccount.getStatus());
        }

        return bankAccountRepository.save(existingAccount);
    }

    @Override
    @Transactional
    public void deleteAccount(Long id) {
        if (!bankAccountRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy tài khoản để xóa");
        }
        bankAccountRepository.deleteById(id);
    }
}
