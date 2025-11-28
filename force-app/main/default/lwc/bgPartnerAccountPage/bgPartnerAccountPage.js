import { LightningElement, api, track } from 'lwc';
import getPartnerSummary from '@salesforce/apex/BG_PartnerMerchantDashboardController.getPartnerSummary';
import getResellerContacts from '@salesforce/apex/BG_PartnerMerchantDashboardController.getResellerContacts';
import { createFilterHandler, resetAndLoad, handlePreviousPage as utilHandlePreviousPage, handleNextPage as utilHandleNextPage } from 'c/filterUtils';

export default class BgPartnerAccountPage extends LightningElement {
    @api accountId;
    @api partnerAccountName = ''; // NEW: Receive partner name from parent dashboard
    
    @track partnerData;
    @track resellerContacts = [];
    @track isLoading = true;
    @track isLoadingContacts = true;
    @track currentPage = 1;
    @track totalCount = 0;
    @track pageSize = 10;
    @track sortField = 'Name';
    @track sortDir = 'ASC';
    @track searchFilter = '';
    @track openSections = [];

    sortOptions = [
        { label: 'Name', value: 'Name' },
        { label: 'Rapids Submitted', value: 'rapidsSubmitted' },
        { label: 'Last Rapid Date', value: 'lastRapidDate' },
        { label: 'Active Accounts', value: 'activeAccounts' }
    ];

    connectedCallback() {
        this.loadPartnerData();
        this.loadContacts();
    }

    async loadPartnerData() {
        this.isLoading = true;
        try {
            this.partnerData = await getPartnerSummary({ accountId: this.accountId });
            
            // Dispatch record name to parent (for dashboard title)
            if (this.partnerData && this.partnerData.accountName) {
                this.dispatchEvent(new CustomEvent('recordloaded', {
                    detail: { recordName: this.partnerData.accountName },
                    bubbles: true,
                    composed: true
                }));
            }
        } catch (error) {
            console.error('Error loading partner data:', error);
        } finally {
            this.isLoading = false;
        }
    }

    async loadContacts() {
        this.isLoadingContacts = true;
        try {
            const result = await getResellerContacts({
                accountId: this.accountId,
                pageNum: this.currentPage,
                pageSize: this.pageSize,
                sortField: this.sortField,
                sortDir: this.sortDir,
                searchTerm: this.searchFilter
            });
            this.resellerContacts = result.records;
            this.totalCount = result.totalCount;
        } catch (error) {
            console.error('Error loading contacts:', error);
        } finally {
            this.isLoadingContacts = false;
        }
    }

    handleContactSearch(event) {
        this.searchFilter = event.target.value;
        resetAndLoad(this, this.loadContacts);
    }

    handleSortChange(event) {
        this.sortField = event.detail.value;
        resetAndLoad(this, this.loadContacts);
    }

    handlePreviousPage() {
        utilHandlePreviousPage(this, this.loadContacts);
    }

    handleNextPage() {
        utilHandleNextPage(this, this.loadContacts);
    }

    handleAccordionToggle(event) {
        this.openSections = event.detail.openSections;
    }

    handleOpenNotes(event) {
        this.dispatchEvent(new CustomEvent('opennotes', { detail: event.detail }));
    }

    get formattedLastRapidDate() {
        if (!this.partnerData?.lastRapidDate) return 'N/A';
        return new Date(this.partnerData.lastRapidDate).toLocaleDateString();
    }

    get formattedPluginFee() {
        if (!this.partnerData?.pluginMonthlyFee) return 'N/A';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
            .format(this.partnerData.pluginMonthlyFee);
    }

    get formattedPremiumPercent() {
        if (!this.partnerData?.premiumAccountsPercent) return '0%';
        return `${this.partnerData.premiumAccountsPercent.toFixed(1)}%`;
    }

    // NEW: Use shared state pattern - same as merchant component
    get displayPartnerAccountName() {
        // Priority: props (shared state from dashboard) > Apex data > fallback
        return this.partnerAccountName || 
               this.partnerData?.accountName || 
               'PNC';
    }

    get hasContacts() {
        return !this.isLoadingContacts && this.resellerContacts.length > 0;
    }

    get noContacts() {
        return !this.isLoadingContacts && this.resellerContacts.length === 0;
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