import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ITicketFilter, ITicketSort, TicketStatus, PriorityLevel } from '../types/ticket.types';

interface TicketState extends ITicketFilter {
    sort: ITicketSort;
    page: number;
    limit: number;
    setFilters: (filters: Partial<ITicketFilter>) => void;
    setSort: (sort: ITicketSort) => void;
    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    resetFilters: () => void;
}

const initialState: Omit<TicketState, 'setFilters' | 'setSort' | 'setPage' | 'setLimit' | 'resetFilters'> = {
    status: [],
    priority: [],
    assignee: undefined,
    team: undefined,
    search: undefined,
    dateRange: undefined,
    sort: {
        field: 'created_at',
        direction: 'desc'
    },
    page: 1,
    limit: 10
};

export const useTicketStore = create<TicketState>()(
    persist(
        (set) => ({
            ...initialState,
            setFilters: (filters) =>
                set((state) => ({
                    ...state,
                    ...filters,
                    // Reset to first page when filters change
                    page: 1
                })),
            setSort: (sort) =>
                set((state) => ({
                    ...state,
                    sort
                })),
            setPage: (page) =>
                set((state) => ({
                    ...state,
                    page
                })),
            setLimit: (limit) =>
                set((state) => ({
                    ...state,
                    limit,
                    // Reset to first page when limit changes
                    page: 1
                })),
            resetFilters: () =>
                set((state) => ({
                    ...initialState,
                    // Preserve sort and pagination settings
                    sort: state.sort,
                    page: state.page,
                    limit: state.limit
                }))
        }),
        {
            name: 'ticket-filters',
            // Only persist these fields
            partialize: (state) => ({
                sort: state.sort,
                limit: state.limit
            })
        }
    )
); 