import { LightningElement, api, track } from 'lwc';
import getResellerContactSummary from '@salesforce/apex/BG_PartnerMerchantDashboardController.getResellerContactSummary';
import getMerchantsByResellerContact from '@salesforce/apex/BG_PartnerMerchantDashboardController.getMerchantsByResellerContact';
import { createFilterHandler, resetAndLoad, handlePreviousPage as utilHandlePreviousPage, handleNextPage as utilHandleNextPage } from 'c/filterUtils';

export default class BgResellerContactPage extends LightningElement {
    @api contactId;
    @api isNested = false;
    
    @track contactData;
    @track merchants = [];
    @track isLoading = true;
    @track isLoadingMerchants = true;
    @track openMerchantSections = [];
    
    // Pagination
    @track currentPage = 1;
    @track totalCount = 0;
    @track pageSize = 10;
    
    // Filters
    @track filterName = '';
    @track filterPlan = '';
    @track filterLevel = '';
    @track filterStatus = '';

    planOptions = [
        { label: 'All Plans', value: '' },
        { label: 'Basic', value: 'Basic' },
        { label: 'Premium', value: 'Premium' },
        { label: 'Enterprise', value: 'Enterprise' }
    ];

    levelOptions = [
        { label: 'All Levels', value: '' },
        { label: 'Level 1', value: '1' },
        { label: 'Level 2', value: '2' },
        { label: 'Level 3', value: '3' },
        { label: 'Level 4', value: '4' },
        { label: 'Level 5', value: '5' }
    ];

    statusOptions = [
        { label: 'All Statuses', value: '' },
        { label: 'Active', value: 'Active' },
        { label: 'Onboarding', value: 'Onboarding' },
        { label: 'Churned', value: 'Churned' }
    ];

    connectedCallback() {
        console.log('ResellerContactPage connected with contactId:', this.contactId);
        if (this.contactId) {
            this.loadContactData();
            this.loadMerchants();
        }
    }

    async loadContactData() {
        this.isLoading = true;
        try {
            this.contactData = await getResellerContactSummary({ contactId: this.contactId });
            console.log('Contact data loaded:', this.contactData);
            console.log('Has partner data:', this.hasPartnerData);
        } catch (error) {
            console.error('Error loading contact data:', error);
        } finally {
            this.isLoading = false;
        }
    }

    async loadMerchants() {
        this.isLoadingMerchants = true;
        console.log('Loading merchants with filters:', {
            filterName: this.filterName,
            filterPlan: this.filterPlan,
            filterLevel: this.filterLevel,
            filterStatus: this.filterStatus,
            currentPage: this.currentPage
        });
        
        try {
            const result = await getMerchantsByResellerContact({
                contactId: this.contactId,
                pageNum: this.currentPage,
                pageSize: this.pageSize,
                filterName: this.filterName,
                filterPlan: this.filterPlan,
                filterLevel: this.filterLevel,
                filterStatus: this.filterStatus
            });
            
            console.log('Merchants loaded:', result);
            
            this.merchants = result.records.map(m => ({
                ...m,
                accordionLabel: `${m.accountName} | ${m.currentPlanType || 'N/A'} | Level ${m.level || 'N/A'} | ${m.adoptionStatus || 'N/A'}`
            }));
            this.totalCount = result.totalCount;
        } catch (error) {
            console.error('Error loading merchants:', error);
            this.merchants = [];
            this.totalCount = 0;
        } finally {
            this.isLoadingMerchants = false;
        }
    }

    // Filter Handlers
    handleNameFilter(event) {
        console.log('Name filter changed:', event.target.value);
        this.filterName = event.target.value;
        resetAndLoad(this, this.loadMerchants);
    }

    handlePlanFilter(event) {
        console.log('Plan filter changed:', event.detail.value);
        this.filterPlan = event.detail.value;
        resetAndLoad(this, this.loadMerchants);
    }

    handleLevelFilter(event) {
        console.log('Level filter changed:', event.detail.value);
        this.filterLevel = event.detail.value;
        resetAndLoad(this, this.loadMerchants);
    }

    handleStatusFilter(event) {
        console.log('Status filter changed:', event.detail.value);
        this.filterStatus = event.detail.value;
        resetAndLoad(this, this.loadMerchants);
    }

    handleAccordionToggle(event) {
        this.openMerchantSections = event.detail.openSections;
    }

    handlePreviousPage() {
        utilHandlePreviousPage(this, this.loadMerchants);
    }

    handleNextPage() {
        utilHandleNextPage(this, this.loadMerchants);
    }

    handleOpenNotes(event) {
        this.dispatchEvent(new CustomEvent('opennotes', { detail: event.detail }));
    }

    // ADDED: Check if partner data exists
    get hasPartnerData() {
        return this.contactData && (
            this.contactData.pluginMonthlyFee || 
            this.contactData.pluginBillTo || 
            this.contactData.techFeeMinimumPlan || 
            this.contactData.achSoldBy
        );
    }

    get formattedLastRapidDate() {
        if (!this.contactData?.lastRapidDate) return 'N/A';
        return new Date(this.contactData.lastRapidDate).toLocaleDateString();
    }

    get formattedPluginFee() {
        if (!this.contactData?.pluginMonthlyFee) return 'N/A';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
            .format(this.contactData.pluginMonthlyFee);
    }

    get hasMerchants() {
        return !this.isLoadingMerchants && this.merchants.length > 0;
    }

    get noMerchants() {
        return !this.isLoadingMerchants && this.merchants.length === 0;
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