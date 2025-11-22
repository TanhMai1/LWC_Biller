import { LightningElement, api, track } from 'lwc';
import getOpportunities from '@salesforce/apex/BG_PartnerMerchantDashboardController.getOpportunities';

export default class BgMerchantOpportunities extends LightningElement {
    @api accountId;
    
    @track opportunities = [];
    @track isLoading = true;
    @track filterStatus = 'Open'; // Default to Open
    @track currentPage = 1;
    @track totalCount = 0;
    @track pageSize = 5;

    columns = [
        { 
            label: 'Opportunity Name', 
            fieldName: 'name', 
            type: 'text',
            cellAttributes: { class: 'slds-text-link' }
        },
        { label: 'Type', fieldName: 'oppType', type: 'text' },
        { label: 'Stage', fieldName: 'stage', type: 'text' }
    ];

    connectedCallback() {
        this.loadOpportunities();
    }

    async loadOpportunities() {
        this.isLoading = true;
        try {
            const result = await getOpportunities({
                accountId: this.accountId,
                filterStatus: this.filterStatus,
                pageNum: this.currentPage,
                pageSize: this.pageSize
            });
            this.opportunities = result.records;
            this.totalCount = result.totalCount;
        } catch (error) {
            console.error('Error loading opportunities:', error);
        } finally {
            this.isLoading = false;
        }
    }

    handleFilterOpen() {
        this.filterStatus = 'Open';
        this.resetAndLoad();
    }

    handleFilterClosed() {
        this.filterStatus = 'Closed';
        this.resetAndLoad();
    }

    handleFilterAll() {
        this.filterStatus = 'All';
        this.resetAndLoad();
    }

    resetAndLoad() {
        this.currentPage = 1;
        this.loadOpportunities();
    }

    handlePreviousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadOpportunities();
        }
    }

    handleNextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadOpportunities();
        }
    }

    get openVariant() {
        return this.filterStatus === 'Open' ? 'brand' : 'neutral';
    }

    get closedVariant() {
        return this.filterStatus === 'Closed' ? 'brand' : 'neutral';
    }

    get allVariant() {
        return this.filterStatus === 'All' ? 'brand' : 'neutral';
    }

    get hasOpportunities() {
        return !this.isLoading && this.opportunities.length > 0;
    }

    get noOpportunities() {
        return !this.isLoading && this.opportunities.length === 0;
    }

    get totalPages() {
        return Math.ceil(this.totalCount / this.pageSize);
    }

    get showPagination() {
        return this.totalPages > 1;
    }

    get isFirstPage() {
        return this.currentPage === 1;
    }

    get isLastPage() {
        return this.currentPage >= this.totalPages;
    }
}