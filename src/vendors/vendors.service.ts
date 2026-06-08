import { Injectable, Inject, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class VendorsService {
  constructor(
    @Inject('DATABASE_POOL') private pool: Pool,
    private readonly paymentsService: PaymentsService
  ) {}

  async updateDetails(vendorId: string, details: any) {
    try {
      const { businessType, gstNumber } = details;
      const { rows } = await this.pool.query(
        'UPDATE vendors SET business_type = $1, gst_number = $2 WHERE id = $3 RETURNING *',
        [businessType, gstNumber, vendorId]
      );
      if (rows.length === 0) throw new NotFoundException('Vendor not found');
      return rows[0];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to update vendor details');
    }
  }

  async updateBankDetails(vendorId: string, bankDetails: any) {
    try {
      const { accountHolderName, bankName, accountNumber, ifscCode, chequeFile } = bankDetails;
      
      // Check if bank details exist
      const existing = await this.pool.query('SELECT id FROM vendor_bank_details WHERE vendor_id = $1', [vendorId]);
      
      let result;
      if (existing.rows.length > 0) {
        result = await this.pool.query(
          'UPDATE vendor_bank_details SET account_holder_name = $1, bank_name = $2, account_number = $3, ifsc_code = $4, cheque_file = $5 WHERE vendor_id = $6 RETURNING *',
          [accountHolderName, bankName, accountNumber, ifscCode, chequeFile, vendorId]
        );
      } else {
        result = await this.pool.query(
          'INSERT INTO vendor_bank_details (vendor_id, account_holder_name, bank_name, account_number, ifsc_code, cheque_file) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [vendorId, accountHolderName, bankName, accountNumber, ifscCode, chequeFile]
        );
      }

      // After updating bank details, create Razorpay Linked Account
      const vendorData = await this.pool.query('SELECT * FROM vendors WHERE id = $1', [vendorId]);
      if (vendorData.rows.length > 0) {
         await this.paymentsService.createLinkedAccount(vendorId, bankDetails, vendorData.rows[0]);
      }

      return result.rows[0];
    } catch (error) {
      throw new InternalServerErrorException('Failed to update bank details');
    }
  }


  async uploadDocuments(vendorId: string, documents: any) {
    try {
      const { companyRegistration, panCard, gstCertificate, ownerId, addressProof } = documents;
      
      const existing = await this.pool.query('SELECT id FROM vendor_documents WHERE vendor_id = $1', [vendorId]);
      
      let result;
      if (existing.rows.length > 0) {
        result = await this.pool.query(
          'UPDATE vendor_documents SET company_registration = $1, pan_card = $2, gst_certificate = $3, owner_id = $4, address_proof = $5 WHERE vendor_id = $6 RETURNING *',
          [companyRegistration, panCard, gstCertificate, ownerId, addressProof, vendorId]
        );
      } else {
        result = await this.pool.query(
          'INSERT INTO vendor_documents (vendor_id, company_registration, pan_card, gst_certificate, owner_id, address_proof) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [vendorId, companyRegistration, panCard, gstCertificate, ownerId, addressProof]
        );
      }
      return result.rows[0];
    } catch (error) {
      throw new InternalServerErrorException('Failed to upload documents');
    }
  }

  async getProfile(vendorId: string) {
    try {
      const vendor = await this.pool.query('SELECT * FROM vendors WHERE id = $1', [vendorId]);
      if (vendor.rows.length === 0) throw new NotFoundException('Vendor not found');
      
      const documents = await this.pool.query('SELECT * FROM vendor_documents WHERE vendor_id = $1', [vendorId]);
      const bankDetails = await this.pool.query('SELECT * FROM vendor_bank_details WHERE vendor_id = $1', [vendorId]);
      
      return {
        ...vendor.rows[0],
        documents: documents.rows[0] || null,
        bankDetails: bankDetails.rows[0] || null
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to get vendor profile');
    }
  }
}
