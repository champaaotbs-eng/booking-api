import { Payment } from 'modules/payments/payment.domain';
import { User } from 'modules/users/user.domain';

export class FilterPaymentDto {
  userId: User['userId'];

  month: number;

  year: number;

  status: string;

  startMonth: number;

  endMonth: number;
}

export class SortPaymentDto {
  orderBy: keyof Payment;
  order: 'ASC' | 'DESC';
}
