/**
 * Shared filter utility for handling common filter operations
 * Used by bgPartnerAccountPage and bgResellerContactPage
 */

/**
 * Creates a filter handler that updates a filter property and triggers a reload
 * @param {Object} component - The component instance
 * @param {String} filterProperty - The name of the filter property to update
 * @param {Function} loadCallback - The callback function to call after updating the filter
 * @returns {Function} - The filter handler function
 */
export function createFilterHandler(component, filterProperty, loadCallback) {
    return function(event) {
        // Handle both input events (event.target.value) and combobox events (event.detail.value)
        const value = event.target ? event.target.value : event.detail.value;
        component[filterProperty] = value;
        component.currentPage = 1;
        loadCallback.call(component);
    };
}

/**
 * Resets pagination and reloads data
 * @param {Object} component - The component instance
 * @param {Function} loadCallback - The callback function to call
 */
export function resetAndLoad(component, loadCallback) {
    component.currentPage = 1;
    loadCallback.call(component);
}

/**
 * Handles pagination - previous page
 * @param {Object} component - The component instance
 * @param {Function} loadCallback - The callback function to call
 */
export function handlePreviousPage(component, loadCallback) {
    if (component.currentPage > 1) {
        component.currentPage--;
        loadCallback.call(component);
    }
}

/**
 * Handles pagination - next page
 * @param {Object} component - The component instance
 * @param {Function} loadCallback - The callback function to call
 */
export function handleNextPage(component, loadCallback) {
    const totalPages = Math.ceil(component.totalCount / component.pageSize);
    if (component.currentPage < totalPages) {
        component.currentPage++;
        loadCallback.call(component);
    }
}

/**
 * Pagination helper getters
 */
export const paginationHelpers = {
    getTotalPages(component) {
        return Math.ceil(component.totalCount / component.pageSize);
    },

    showPagination(component) {
        return this.getTotalPages(component) > 1;
    },

    isFirstPage(component) {
        return component.currentPage === 1;
    },

    isLastPage(component) {
        return component.currentPage >= this.getTotalPages(component);
    }
};
