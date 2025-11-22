import { LightningElement, api, track } from 'lwc';
import getMerchantSummary from '@salesforce/apex/BG_PartnerMerchantDashboardController.getMerchantSummary';

export default class BgMerchantAccountPage extends LightningElement {
    @api accountId;
    @api isNested = false;
    @api showPartnerSummary = false;  // NEW PROPERTY
    
    @track merchantData;
    @track isLoading = true;

    connectedCallback() {
        this.loadMerchantData();
    }

    async loadMerchantData() {
        this.isLoading = true;
        try {
            this.merchantData = await getMerchantSummary({ accountId: this.accountId });
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