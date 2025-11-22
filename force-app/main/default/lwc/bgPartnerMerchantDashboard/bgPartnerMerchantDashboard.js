import { LightningElement, api, wire, track } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import resolveContext from '@salesforce/apex/BG_PartnerMerchantDashboardController.resolveContext';

export default class BgPartnerMerchantDashboard extends LightningElement {
    @api recordId;
    @track dashboardMode = 'Search';
    @track isLoading = true;
    @track isNotesSidebarOpen = false;
    @track currentRecordId;
    @track recordName = '';

    @wire(CurrentPageReference)
    pageRef;

    connectedCallback() {
        this.initializeDashboard();
    }

    async initializeDashboard() {
        this.isLoading = true;
        try {
            if (this.recordId) {
                const ctx = await resolveContext({ recordId: this.recordId });
                this.dashboardMode = ctx.dashboardMode;
                this.currentRecordId = this.recordId;
            } else {
                this.dashboardMode = 'Search';
            }
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            this.dashboardMode = 'Search';
        } finally {
            this.isLoading = false;
        }
    }

    handleRecordSelect(event) {
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

    get showSearch() {
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
        return 'Dashboard';
    }
}