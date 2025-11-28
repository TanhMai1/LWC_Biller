import { LightningElement, api, wire, track } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import resolveContext from '@salesforce/apex/BG_PartnerMerchantDashboardController.resolveContext';

export default class BgPartnerMerchantDashboard extends LightningElement {
    _recordId;
    @track dashboardMode = 'Search';
    @track isLoading = false;
    @track isNotesSidebarOpen = false;
    @track currentRecordId;
    @track currentRecordName = '';
    @track parentAccountName = ''; // NEW: Store parent account name

    @wire(CurrentPageReference)
    pageRef;

    @api
    get recordId() {
        return this._recordId;
    }
    set recordId(value) {
        this._recordId = value;
        this.initializeDashboard();
    }

    connectedCallback() {
        if (!this._recordId) {
            this.initializeDashboard();
        }
    }

    async initializeDashboard() {
        this.isLoading = true;

        try {
            if (this._recordId) {
                const ctx = await resolveContext({ recordId: this._recordId });
                this.dashboardMode = ctx.dashboardMode;
                this.currentRecordId = this._recordId;
            } else {
                this.dashboardMode = 'Search';
                this.currentRecordId = null;
                this.currentRecordName = '';
                this.parentAccountName = '';
            }
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            this.dashboardMode = 'Search';
        } finally {
            this.isLoading = false;
        }
    }

    handleRecordSelect(event) {
        const { recordId, objectType, recordType, name } = event.detail;
        this.currentRecordId = recordId;
        this.currentRecordName = name || '';
        this.parentAccountName = ''; // Reset parent name
        
        if (objectType === 'Account') {
            this.dashboardMode = recordType === 'Reseller' ? 'Partner' : 'Merchant';
        } else if (objectType === 'Contact') {
            this.dashboardMode = 'ResellerContact';
        }
    }

    // NEW: Handle when child components load and provide names
    handleRecordLoaded(event) {
        if (event.detail) {
            // Main record name (merchant/partner/contact)
            if (event.detail.recordName) {
                this.currentRecordName = event.detail.recordName;
            }
            // Parent account name (for merchants with parents)
            if (event.detail.parentAccountName) {
                this.parentAccountName = event.detail.parentAccountName;
            }
        }
    }

    handleOpenNotes(event) {
        this.isNotesSidebarOpen = true;
    }

    handleCloseNotes() {
        this.isNotesSidebarOpen = false;
    }

    get showSearchHeader() {
        return this.dashboardMode === 'Search' && !this.isLoading;
    }

    get showDashboardHeader() {
        return this.dashboardMode !== 'Search' && !this.isLoading;
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
        if (this.isPartnerMode) {
            return this.currentRecordName 
                ? `Partner Overview Dashboard - ${this.currentRecordName}` 
                : 'Partner Overview Dashboard - PNC';
        }
        if (this.isMerchantMode) {
            return this.currentRecordName 
                ? `Merchant Overview Dashboard - ${this.currentRecordName}` 
                : 'Merchant Overview Dashboard';
        }
        if (this.isResellerContactMode) {
            return this.currentRecordName 
                ? `Reseller Contact - ${this.currentRecordName}` 
                : 'Reseller Contact Dashboard';
        }
        return 'Dashboard';
    }
}