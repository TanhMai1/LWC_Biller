import { LightningElement, api, track } from 'lwc';
import getPageSummary from '@salesforce/apex/BG_PartnerMerchantDashboardController.getPageSummary';

export default class BgPageSummary extends LightningElement {
    @api recordId;
    @api summaryType; // 'PartnerInfo', 'MerchantSummary', 'ResellerContactKPI'
    
    @track summaryData;
    @track isLoading = true;
    @track hasError = false;

    connectedCallback() {
        this.loadSummary();
    }

    async loadSummary() {
        this.isLoading = true;
        this.hasError = false;
        try {
            const result = await getPageSummary({
                recordId: this.recordId,
                summaryType: this.summaryType
            });
            this.summaryData = result.data;
        } catch (error) {
            console.error('Error loading summary:', error);
            this.hasError = true;
        } finally {
            this.isLoading = false;
        }
    }

    get cardTitle() {
        const titles = {
            'PartnerInfo': 'Partner Information',
            'MerchantSummary': 'Merchant Summary',
            'ResellerContactKPI': 'Reseller Contact KPIs'
        };
        return titles[this.summaryType] || 'Summary';
    }

    get cardIcon() {
        const icons = {
            'PartnerInfo': 'standard:partner_marketing_budget',
            'MerchantSummary': 'utility:summary',
            'ResellerContactKPI': 'utility:chart'
        };
        return icons[this.summaryType] || 'utility:info';
    }

    get isPartnerInfo() {
        return this.summaryType === 'PartnerInfo';
    }

    get isMerchantSummary() {
        return this.summaryType === 'MerchantSummary';
    }

    get isResellerContactKPI() {
        return this.summaryType === 'ResellerContactKPI';
    }

    get hasData() {
        return !this.isLoading && !this.hasError && this.summaryData;
    }

    get formattedPluginFee() {
        if (!this.summaryData?.pluginMonthlyFee) return 'N/A';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
            .format(this.summaryData.pluginMonthlyFee);
    }

    get formattedLevel() {
        if (!this.summaryData?.level) return 'N/A';
        return `Level ${this.summaryData.level}`;
    }

    get formattedLastTransaction() {
        if (!this.summaryData?.lastTransactionDate) return 'N/A';
        return new Date(this.summaryData.lastTransactionDate).toLocaleDateString();
    }

    get formattedLastRapidDate() {
        if (!this.summaryData?.lastRapidDate) return 'N/A';
        return new Date(this.summaryData.lastRapidDate).toLocaleDateString();
    }
}