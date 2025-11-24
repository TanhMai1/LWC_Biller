import { LightningElement, api, wire, track } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import resolveContext from '@salesforce/apex/BG_PartnerMerchantDashboardController.resolveContext';

export default class BgPartnerMerchantDashboard extends LightningElement {
    _recordId;
    @track dashboardMode = 'Search';
    @track isLoading = false;
    @track isNotesSidebarOpen = false;
    @track currentRecordId;
    @track recordName = '';

    @wire(CurrentPageReference)
    pageRef;

    @api
    get recordId() {
        return this._recordId;
    }
    set recordId(value) {
        this._recordId = value;
        // Initialize when recordId is set
        this.initializeDashboard();
    }

    connectedCallback() {
        console.log('Dashboard connected, recordId:', this._recordId);
        // Initialize for app/home pages (no recordId)
        if (!this._recordId) {
            this.initializeDashboard();
        }
    }

    async initializeDashboard() {
        this.isLoading = true;

        try {
            if (this._recordId) {
                // Hide search and show record-specific dashboard
                const ctx = await resolveContext({ recordId: this._recordId });
                this.dashboardMode = ctx.dashboardMode;
                this.currentRecordId = this._recordId;
            } else {
                // Show welcome message when no recordId (home/app page)
                this.dashboardMode = 'Search';
                this.currentRecordId = null;
            }
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            this.dashboardMode = 'Search';
        } finally {
            this.isLoading = false;
        }
    }

    handleRecordSelect(event) {
        console.log('Record selected:', event.detail);
        const { recordId, objectType, recordType } = event.detail;
        this.currentRecordId = recordId;
        
        if (objectType === 'Account') {
            this.dashboardMode = recordType === 'Reseller' ? 'Partner' : 'Merchant';
        } else if (objectType === 'Contact') {
            this.dashboardMode = 'ResellerContact';
        }
    }

    handleOpenNotes(event) {
        this.isNotesSidebarOpen = true;
    }

    handleCloseNotes() {
        this.isNotesSidebarOpen = false;
    }

    // UPDATED: Remove showSearch getter since search is always visible
    get showWelcome() {
        return this.dashboardMode === 'Search' && !this.isLoading;
    }

    get showDashboard() {
        return this.dashboardMode !== 'Search' && !this.isLoading;
    }

    get isPartnerMode() {
        return this.dashboardMode === 'Partner';
    }

    get isMerchantMode() {
        return this.dashboardMode === 'Merchant';
    }

    get isResellerContactMode() {
        return this.dashboardMode === 'ResellerContact';
    }

    get mainContentClass() {
        return this.isNotesSidebarOpen 
            ? 'slds-col slds-size_9-of-12' 
            : 'slds-col slds-size_1-of-1';
    }

    get dashboardTitle() {
        if (this.isPartnerMode) return 'Partner Overview Dashboard - PNC';
        if (this.isMerchantMode) return 'Merchant Overview Dashboard';
        if (this.isResellerContactMode) return 'Reseller Contact';
        return 'Biller Genie Dashboard';
    }
}