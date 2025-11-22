import { LightningElement, api, track } from 'lwc';
import getCases from '@salesforce/apex/BG_PartnerMerchantDashboardController.getCases';

export default class BgMerchantCases extends LightningElement {
    @api accountId;
    
    @track cases = [];
    @track isLoading = true;
    @track filterStatus = 'Open'; // Default to Open
    @track currentPage = 1;
    @track totalCount = 0;
    @track pageSize = 5;

    columns = [
        { 
            label: 'Case Number', 
            fieldName: 'caseNumber', 
            type: 'text',
            cellAttributes: { class: 'slds-text-link' }
        },
        { label: 'Type', fieldName: 'caseType', type: 'text' },
        { label: 'Owner', fieldName: 'ownerName', type: 'text' },
        { label: 'Status', fieldName: 'status', type: 'text' },
        { label: 'Category', fieldName: 'category', type: 'text' },
        { label: 'Sub-Category', fieldName: 'subCategory', type: 'text' },
        { 
            label: 'Summary', 
            fieldName: 'summary', 
            type: 'text',
            wrapText: true,
            initialWidth: 200
        }
    ];

    connectedCallback() {
        this.loadCases();
    }

    async loadCases() {
        this.isLoading = true;
        try {
            const result = await getCases({
                accountId: this.accountId,
                filterStatus: this.filterStatus,
                pageNum: this.currentPage,
                pageSize: this.pageSize
            });
            this.cases = result.records;
            this.totalCount = result.totalCount;
        } catch (error) {
            console.error('Error loading cases:', error);
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
        this.loadCases();
    }

    handlePreviousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadCases();
        }
    }

    handleNextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadCases();
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

    get hasCases() {
        return !this.isLoading && this.cases.length > 0;
    }

    get noCases() {
        return !this.isLoading && this.cases.length === 0;
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