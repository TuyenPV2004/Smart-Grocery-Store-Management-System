package com.grocery.management.service;

import com.grocery.management.dto.ProductSnapshot;
import com.grocery.management.dto.SupplierSnapshot;
import com.grocery.management.entity.InventoryNoteDetail;
import com.grocery.management.entity.ProductBatch;
import org.springframework.stereotype.Component;

@Component
public class InventorySnapshotMapper {
    public void applyProduct(ProductBatch batch, ProductSnapshot product) {
        batch.setProductId(product.getId());
        batch.setProductSku(product.getSku());
        batch.setProductName(product.getName());
        batch.setProductUnit(product.getUnit());
        batch.setProductBrand(product.getBrand());
        batch.setProductThumbnail(product.getThumbnail());
    }

    public void applyProduct(InventoryNoteDetail detail, ProductSnapshot product) {
        detail.setProductId(product.getId());
        detail.setProductSku(product.getSku());
        detail.setProductName(product.getName());
        detail.setProductUnit(product.getUnit());
        detail.setProductBrand(product.getBrand());
        detail.setProductThumbnail(product.getThumbnail());
    }

    public void applySupplier(ProductBatch batch, SupplierSnapshot supplier) {
        batch.setSupplierId(supplier.getId());
        batch.setSupplierCode(supplier.getCode());
        batch.setSupplierName(supplier.getVietnameseName());
    }

    public void applyBatch(InventoryNoteDetail detail, ProductBatch batch) {
        detail.setProductId(batch.getProductId());
        detail.setProductSku(batch.getProductSku());
        detail.setProductName(batch.getProductName());
        detail.setProductUnit(batch.getProductUnit());
        detail.setProductBrand(batch.getProductBrand());
        detail.setProductThumbnail(batch.getProductThumbnail());
    }
}
