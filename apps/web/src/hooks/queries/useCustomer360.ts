import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { CustomerItem } from "./useCustomers";
import { CustomerContactItem } from "./useCustomerContacts";
import { OpportunityItem } from "./useOpportunities";
import { CrmActivityItem } from "./useCrmActivities";
import { CrmTaskItem } from "./useCrmTasks";
import { CrmNoteItem } from "./useCrmNotes";
import { CrmTagItem } from "./useCrmTags";

export interface Customer360Data {
  customer: CustomerItem;
  contacts: CustomerContactItem[];
  tags: CrmTagItem[];
  metrics: {
    totalPurchases: number;
    totalPaid: number;
    outstandingBalance: number;
    totalOrders: number;
    totalInvoices: number;
    totalOpportunities: number;
    wonOpportunitiesCount: number;
    wonOpportunitiesValue: number;
  };
  salesHistory: {
    quotations: any[];
    salesOrders: any[];
    salesInvoices: any[];
    customerPayments: any[];
    salesReturns: any[];
  };
  posHistory: any[];
  opportunities: OpportunityItem[];
  activities: CrmActivityItem[];
  tasks: CrmTaskItem[];
  notes: CrmNoteItem[];
  timeline: Array<{
    id: string;
    kind: string;
    title: string;
    description?: string;
    timestamp: string;
    metadata?: any;
  }>;
}

export function useCustomer360(customerId: string) {
  return useQuery<Customer360Data>({
    queryKey: ["customer-360", customerId],
    queryFn: () => apiClient<Customer360Data>(`/crm/customer-360/${customerId}`),
    enabled: Boolean(customerId),
  });
}
