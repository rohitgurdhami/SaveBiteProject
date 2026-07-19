import { BaseRepository } from './BaseRepository';
import { DonationRequest } from '../types';
import { getConnection } from '../config/database';

export class DonationRequestRepository extends BaseRepository<DonationRequest> {
  protected tableName = 'donation_requests';

  async findByDonationId(donationId: number): Promise<DonationRequest[]> {
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT dr.*, u.fullName as recipientName
         FROM ${this.tableName} dr
         JOIN users u ON dr.recipientId = u.id
         WHERE dr.donationId = ?`,
        [donationId]
      );
      return rows as DonationRequest[];
    } finally {
      connection.release();
    }
  }

  async findByRecipientId(recipientId: number, limit: number = 100, offset: number = 0): Promise<DonationRequest[]> {
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT dr.*, d.*, u.fullName as donorName, fi.foodName
         FROM ${this.tableName} dr
         JOIN donations d ON dr.donationId = d.id
         JOIN users u ON d.donorId = u.id
         JOIN food_inventory fi ON d.foodInventoryId = fi.id
         WHERE dr.recipientId = ?
         ORDER BY dr.createdAt DESC LIMIT ? OFFSET ?`,
        [recipientId, limit, offset]
      );
      return rows as DonationRequest[];
    } finally {
      connection.release();
    }
  }

  async findPendingByDonorId(donorId: number): Promise<DonationRequest[]> {
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT dr.*, u.fullName as recipientName, fi.foodName
         FROM ${this.tableName} dr
         JOIN donations d ON dr.donationId = d.id
         JOIN users u ON dr.recipientId = u.id
         JOIN food_inventory fi ON d.foodInventoryId = fi.id
         WHERE d.donorId = ? AND dr.status = 'pending'`,
        [donorId]
      );
      return rows as DonationRequest[];
    } finally {
      connection.release();
    }
  }

  async updateStatus(id: number, status: string): Promise<any> {
    const connection = await getConnection();
    try {
      const [result] = await connection.execute(
        `UPDATE ${this.tableName} SET status = ? WHERE id = ?`,
        [status, id]
      );
      return result;
    } finally {
      connection.release();
    }
  }

  async checkDuplicateRequest(donationId: number, recipientId: number): Promise<boolean> {
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT COUNT(*) as count FROM ${this.tableName} 
         WHERE donationId = ? AND recipientId = ? AND status IN ('pending', 'accepted')`,
        [donationId, recipientId]
      );
      return (rows as any[])[0].count > 0;
    } finally {
      connection.release();
    }
  }
}
