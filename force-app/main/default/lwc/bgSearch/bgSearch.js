import { LightningElement, track } from 'lwc';
import searchRecords from '@salesforce/apex/BG_PartnerMerchantDashboardController.searchRecords';

export default class BgSearch extends LightningElement {
    @track searchTerm = '';
    @track searchResults = [];
    @track isSearching = false;
    @track hasSearched = false;

    searchTimeout;

    handleSearchInput(event) {
        const value = event.target.value;
        this.searchTerm = value;

        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Debounce search
        if (value.length >= 2) {
            this.searchTimeout = setTimeout(() => {
                this.performSearch();
            }, 300);
        } else {
            this.searchResults = [];
            this.hasSearched = false;
        }
    }

    async performSearch() {
        this.isSearching = true;
        this.hasSearched = true;
        try {
            const results = await searchRecords({ searchTerm: this.searchTerm });
            this.searchResults = results.map(r => ({
                ...r,
                iconName: this.getIconName(r.objectType, r.recordType)
            }));
        } catch (error) {
            console.error('Search error:', error);
            this.searchResults = [];
        } finally {
            this.isSearching = false;
        }
    }

    handleResultSelect(event) {
        const recordId = event.currentTarget.dataset.recordId;
        const objectType = event.currentTarget.dataset.objectType;
        const recordType = event.currentTarget.dataset.recordType;
        
        // Find the selected result to get the name
        const selectedResult = this.searchResults.find(r => r.recordId === recordId);
        const name = selectedResult ? selectedResult.name : '';

        // Dispatch custom event to parent with name included
        this.dispatchEvent(new CustomEvent('recordselect', {
            detail: { recordId, objectType, recordType, name },
            bubbles: true,
            composed: true
        }));

        // Clear search
        this.searchTerm = '';
        this.searchResults = [];
        this.hasSearched = false;
    }

    getIconName(objectType, recordType) {
        if (objectType === 'Contact') return 'standard:contact';
        if (recordType === 'Reseller') return 'standard:partner_marketing_budget';
        return 'standard:account';
    }

    get showResults() {
        return !this.isSearching && this.searchResults.length > 0;
    }

    get noResults() {
        return !this.isSearching && this.hasSearched && this.searchResults.length === 0;
    }
}