import { LightningElement, api, track } from 'lwc';
import getNotes from '@salesforce/apex/BG_PartnerMerchantDashboardController.getNotes';

export default class BgNotes extends LightningElement {
    @api parentId;
    
    @track notes = [];
    @track isLoading = false;
    @track isLoadingMore = false;
    @track hasMore = false;
    @track filterObjectType = '';
    @track filterMerchantAccount = '';
    @track currentPage = 1;
    @track pageSize = 10;
    @track initialLoadDone = false;
    @track merchantAccountOptions = [];

    objectTypeOptions = [
        { label: 'All Types', value: '' },
        { label: 'Account', value: 'Account' },
        { label: 'Opportunity', value: 'Opportunity' },
        { label: 'Case', value: 'Case' },
        { label: 'Contact', value: 'Contact' }
    ];

    connectedCallback() {
        // Lazy load - only load when sidebar opens
        this.loadMerchantAccounts();
        this.loadNotes();
    }

    async loadMerchantAccounts() {
        // Load merchant accounts for filter dropdown if parent is Partner or Contact
        try {
            // This would need an additional Apex method to get merchant accounts
            // For now, we'll leave it empty and populate dynamically
            this.merchantAccountOptions = [{ label: 'All Merchants', value: '' }];
        } catch (error) {
            console.error('Error loading merchant accounts:', error);
        }
    }

    async loadNotes() {
        this.isLoading = true;
        try {
            const result = await getNotes({
                parentId: this.parentId,
                objectTypeFilter: this.filterObjectType,
                merchantAccountFilter: this.filterMerchantAccount,
                pageNum: 1,
                pageSize: this.pageSize
            });
            this.notes = this.formatNotes(result.records);
            this.hasMore = result.hasMore;
            this.currentPage = 1;
            this.initialLoadDone = true;
        } catch (error) {
            console.error('Error loading notes:', error);
        } finally {
            this.isLoading = false;
        }
    }

    async handleLoadMore() {
        this.isLoadingMore = true;
        try {
            const nextPage = this.currentPage + 1;
            const result = await getNotes({
                parentId: this.parentId,
                objectTypeFilter: this.filterObjectType,
                merchantAccountFilter: this.filterMerchantAccount,
                pageNum: nextPage,
                pageSize: this.pageSize
            });
            this.notes = [...this.notes, ...this.formatNotes(result.records)];
            this.hasMore = result.hasMore;
            this.currentPage = nextPage;
        } catch (error) {
            console.error('Error loading more notes:', error);
        } finally {
            this.isLoadingMore = false;
        }
    }

    formatNotes(notesList) {
        return notesList.map(note => ({
            ...note,
            formattedDate: note.createdDate 
                ? new Date(note.createdDate).toLocaleString() 
                : 'N/A'
        }));
    }

    handleObjectTypeFilter(event) {
        this.filterObjectType = event.detail.value;
        this.loadNotes();
    }

    handleClose() {
        this.dispatchEvent(new CustomEvent('closesidebar'));
    }

    get hasNotes() {
        return !this.isLoading && this.notes.length > 0;
    }

    get noNotes() {
        return !this.isLoading && this.initialLoadDone && this.notes.length === 0;
    }
}