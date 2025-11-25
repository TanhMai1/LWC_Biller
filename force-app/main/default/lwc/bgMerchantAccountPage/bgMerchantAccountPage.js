import { LightningElement, api, track } from 'lwc';
import getMerchantSummary from '@salesforce/apex/BG_PartnerMerchantDashboardController.getMerchantSummary';

console.log('🚨🚨🚨 bgMerchantAccountPage.js FILE IS LOADING 🚨🚨🚨');

export default class BgMerchantAccountPage extends LightningElement {
    @api accountId;
    @api isNested = false;
    
    @track merchantData;
    @track isLoading = true;

    constructor() {
        super();
        console.log('🟣 CONSTRUCTOR CALLED - Component is being created');
        console.log('🟣 accountId in constructor:', this.accountId);
    }

    connectedCallback() {
        console.log('🔵🔵🔵 CONNECTED CALLBACK START 🔵🔵🔵');
        console.log('🔵 accountId:', this.accountId);
        console.log('🔵 isNested:', this.isNested);
        console.log('🔵 typeof accountId:', typeof this.accountId);
        console.log('🔵 accountId is empty?', !this.accountId);
        
        if (!this.accountId) {
            console.error('🔴 ERROR: accountId is missing! Cannot load data.');
            return;
        }
        
        console.log('🔵 About to call loadMerchantData()');
        this.loadMerchantData();
    }

    disconnectedCallback() {
        console.log('🔴 DISCONNECTED - Component is being destroyed');
    }

    async loadMerchantData() {
        console.log('🔵🔵🔵 LOAD MERCHANT DATA STARTED 🔵🔵🔵');
        console.log('   accountId parameter:', this.accountId);
        
        if (!this.accountId) {
            console.error('🔴 Cannot load merchant data: accountId is null/undefined');
            this.isLoading = false;
            return;
        }
        
        this.isLoading = true;
        
        try {
            console.log('🔵 Calling Apex getMerchantSummary...');
            
            this.merchantData = await getMerchantSummary({ accountId: this.accountId });
            
            console.log('🟢🟢🟢 APEX RESPONSE RECEIVED 🟢🟢🟢');
            console.log('   Full merchantData object:', this.merchantData);
            console.log('   pluginMonthlyFee:', this.merchantData?.pluginMonthlyFee);
            console.log('   pluginBillTo:', this.merchantData?.pluginBillTo);
            console.log('   techFeeMinimumPlan:', this.merchantData?.techFeeMinimumPlan);
            console.log('   achSoldBy:', this.merchantData?.achSoldBy);
            
            // Check partner data
            const checkPartner = this.hasPartnerData;
            console.log('🟡 hasPartnerData result:', checkPartner);
            console.log('🟡 showPartnerSummary result:', this.showPartnerSummary);
            
        } catch (error) {
            console.error('🔴🔴🔴 APEX ERROR 🔴🔴🔴');
            console.error('   Error message:', error.message);
            console.error('   Error body:', error.body);
            console.error('   Full error:', error);
        } finally {
            this.isLoading = false;
            console.log('🔵 Loading complete, isLoading:', this.isLoading);
        }
    }

    handleOpenNotes() {
        console.log('📝 handleOpenNotes called');
        this.dispatchEvent(new CustomEvent('opennotes', {
            detail: { parentId: this.accountId }
        }));
    }

    get hasPartnerData() {
        if (!this.merchantData) {
            return false;
        }
        
        const hasData = Boolean(
            this.merchantData.pluginMonthlyFee || 
            this.merchantData.pluginBillTo || 
            this.merchantData.techFeeMinimumPlan || 
            this.merchantData.achSoldBy
        );
        
        return hasData;
    }

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

console.log('🚨🚨🚨 bgMerchantAccountPage.js FILE LOADED SUCCESSFULLY 🚨🚨🚨');