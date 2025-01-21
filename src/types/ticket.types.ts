import { AuthUser } from './auth.types';

export enum TicketStatus {
    New = 'new',
    Open = 'open',
    Pending = 'pending',
    Solved = 'solved',
    Closed = 'closed'
}

export enum PriorityLevel {
    Low = 'low',
    Medium = 'medium',
    High = 'high',
    Urgent = 'urgent'
}

export interface ITicket {
    id: string;
    subject: string;
    description: string;
    status: TicketStatus;
    priority: PriorityLevel;
    customer_user_id: string;
    assigned_to?: string;
    team_id: string;
    created_at: string;
    updated_at: string;
    // Populated fields
    assignee?: AuthUser;
    creator?: AuthUser;
}

export interface ITicketComment {
    id: string;
    ticket_id: string;
    content: string;
    is_internal: boolean;
    user_id: string;
    created_at: string;
    updated_at: string;
    // Populated fields
    creator?: AuthUser;
}

export interface ITicketFilter {
    status?: TicketStatus[];
    priority?: PriorityLevel[];
    assignee?: string;
    team?: string;
    search?: string;
    dateRange?: {
        start: string;
        end: string;
    };
}

export interface ITicketSort {
    field: 'created_at' | 'updated_at' | 'priority' | 'status';
    direction: 'asc' | 'desc';
}

export interface ITicketListParams extends ITicketFilter {
    sort?: ITicketSort;
    page?: number;
    limit?: number;
} 