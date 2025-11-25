import { LightningElement, api, track } from 'lwc';
import getMerchantSummary from '@salesforce/apex/BG_PartnerMerchantDashboardController.getMerchantSummary';

export default class BgMerchantAccountPage extends LightningElement {
    @api accountId;
    @api isNested = false;
    // Removed showPartnerSummary prop - will show automatically if data exists
    
    @track merchantData;
    @track isLoading = true;

    connectedCallback() {
        console.log('MerchantAccountPage connected with accountId:', this.accountId);
        this.loadMerchantData();
    }

    async loadMerchantData() {
        this.isLoading = true;
        try {
            this.merchantData = await getMerchantSummary({ accountId: this.accountId });
            console.log('Merchant data loaded:', this.merchantData);
            console.log('Has partner data:', this.hasPartnerData);
        } catch (error) {
            console.error('Error loading merchant data:', error);
        } finally {
            this.isLoading = false;
        }
    }

    handleOpenNotes() {
        this.dispatchEvent(new CustomEvent('opennotes', {
            detail: { parentId: this.accountId }
        }));
    }

    // ADDED: Check if partner data exists
    get hasPartnerData() {
        return this.merchantData && (
            this.merchantData.pluginMonthlyFee || 
            this.merchantData.pluginBillTo || 
            this.merchantData.techFeeMinimumPlan || 
            this.merchantData.achSoldBy
        );
    }

    // UPDATED: Automatically show partner summary if data exists
    get showPartnerSummary() {
        return this.hasPartnerData;
    }

    get formattedLastTransaction() {
        if (!this.merchantData?.lastTransactionDate) return 'N/A';
        return new Date(this.merchantData.lastTransactionDate).toLocaleDateString();
    }

    get formattedLevel() {
        if (!this.merchantData?.level) return 'N/A';
        return `${this.merchantData.level}`;
    }

    get formattedPluginFee() {
        if (!this.merchantData?.pluginMonthlyFee) return 'N/A';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
            .format(this.merchantData.pluginMonthlyFee);
    }

    get merchantSummaryColumnClass() {
        return this.showPartnerSummary ? 'slds-col slds-size_1-of-2' : 'slds-col slds-size_1-of-3';
    }
}