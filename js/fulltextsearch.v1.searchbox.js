/*
 * FullTextSearch - Full text search framework for Nextcloud
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Maxence Lange <maxence@artificial-owl.com>
 * @copyright 2018
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

/** global: OCA */
/** global: nav */
/** global: _ */
/** global: api */
/** global: search */
/** global: result */
/** global: fullTextSearch */
/** global: settings */


var box_elements = {
    searchInput: null,
    searchOptions: null,
    searchTemplate: null,
    searchError: null,
    divFullTextSearchIcon: null,
    divFullTextSearchPopup: null
};


var searchbox = {

    init: function () {

        var self = this;

        // we remove old search
        var search_form = $('FORM.searchbox');
        if (search_form.length > 0) {
            search_form.remove();
        }

        var divHeaderRight = $('DIV.header-right');
        var divFullTextSearch = $('<div>', {id: 'fulltextsearch'});
        divHeaderRight.prepend(divFullTextSearch);

        box_elements.divFullTextSearchIcon = searchbox.generateFullTextSearchIcon();
        box_elements.divFullTextSearchPopup = searchbox.generateFullTextSearchPopup();
        divFullTextSearch.append(box_elements.divFullTextSearchIcon);
        divFullTextSearch.append(box_elements.divFullTextSearchPopup);

        OC.registerMenu(box_elements.divFullTextSearchIcon, box_elements.divFullTextSearchPopup,
            searchbox.displayedSearchPopup);

        api.retrieveOptions(settings.searchProviderId);

        $(window).bind('keydown', function (event) {
            if (event.ctrlKey || event.metaKey) {
                if (String.fromCharCode(event.which).toLowerCase() === 'f') {
                    event.preventDefault();
                    searchbox.displaySearchPopup(true);
                }

                return;
            }

            if (event.which === 27) {
                searchbox.displaySearchPopup(false);
            }
        });

    },


    generateFullTextSearchIcon: function () {
        var className = 'icon-fulltextsearch';
        if (OCA.Theming === undefined || !OCA.Theming.inverted) {
            className = 'icon-fulltextsearch-white';
        }

        var icon = $('<div>', {
            id: 'fts-icon',
            tabindex: 0,
            role: 'link',
            class: className + ' menutoggle'
        });

        icon.fadeTo(0, 0.6);

        return icon;
    },


    generateFullTextSearchPopup: function () {
        var popup = $('<div>', {
            id: 'fts-popup'
        });

        box_elements.searchInput = $('<input>', {
            id: 'fts-input',
            placeholder: t('fulltextsearch', 'Search') + ' ' + settings.searchProviderName
        }).on('keyup', searchbox.timedSearch);
        box_elements.searchOptions = $('<div>', {id: 'fts-options'});
        box_elements.searchTemplate = $('<div>', {id: 'fts-options-template'});
        box_elements.searchError = $('<div>', {id: 'fts-error'});

        var divHeader = $('<div>', {id: 'fts-header'});
        divHeader.append($('<div>').append(box_elements.searchInput));

        popup.append(divHeader);
        popup.append(box_elements.searchOptions);
        popup.append(box_elements.searchTemplate);
        popup.append(box_elements.searchError.hide());

        return popup;
    },


    displaySearchPopup: function (display) {
        if (display) {
            OC.showMenu(box_elements.divFullTextSearchIcon, box_elements.divFullTextSearchPopup,
                searchbox.displayedSearchPopup);
        } else {
            OC.hideMenus(null);
        }
    },


    displayedSearchPopup: function () {
        box_elements.searchError.hide();
        box_elements.searchInput.focus();
    },


    searching: function () {
        if (curr.lastRequestTimer !== null) {
            window.clearTimeout(curr.lastRequestTimer);
            curr.lastRequestTimer = null;
        }

        if (curr.lastSearchTimer !== null) {
            window.clearTimeout(curr.lastSearchTimer);
        }

        var search = box_elements.searchInput.val();
        if (search.length < 1) {
            return;
        }

        curr.lastRequest = search;
        api.search({
            providers: settings.searchProviderId,
            search: search,
            page: curr.page,
            options: searchbox.getSearchOptions(),
            size: 20
        });
    },


    timedSearch: function () {

        if (curr.lastSearchTimer !== null) {
            window.clearTimeout(curr.lastSearchTimer);
        }

        curr.lastSearchTimer = window.setTimeout(function () {
            searchbox.searching();
        }, settings.searchEntryTimer);

        if (curr.lastRequestTimer === null) {
            curr.lastRequestTimer = window.setTimeout(function () {
                searchbox.searching();
            }, settings.searchRequestTimer);
        }
    },


    onOptionsLoaded: function (result) {
        if (!result[settings.searchProviderId]) {
            return;
        }

        if (result[settings.searchProviderId]['options']) {
            searchbox.generateOptionsHtml(result[settings.searchProviderId]['options']);
            box_elements.searchOptions.find('INPUT').each(function () {
                searchbox.eventOnOptionsLoadedInput($(this));
            });
        }

        if (result[settings.searchProviderId]['template']) {
            box_elements.searchTemplate.html(result[settings.searchProviderId]['template']);
            box_elements.searchTemplate.find('INPUT').each(function () {
                searchbox.eventOnOptionsLoadedInput($(this))
            });
        }
    },


    eventOnOptionsLoadedInput: function (div) {
        div.on('change keyup', function () {
//			console.log('eventOnOptionsLoadedInput');

            searchbox.searching();
        });
    },


    generateOptionsHtml: function (options) {
        var div = $('<div>', {class: 'div-table'});

        for (var j = 0; j < options.length; j++) {
            var sub = options[j];
            searchbox.displayPanelGrouplabel(div, sub);
            searchbox.displayPanelCheckbox(div, sub);
            searchbox.displayPanelInput(div, sub);
        }

        box_elements.searchOptions.append(div);
    },


    displayPanelOptionTitle: function (sub, customClass) {
        customClass = customClass || "";
        var subDiv = $('<div>', {
            class: 'div-table-row ' + customClass
        });

        subDiv.append($('<div>',
            {
                class: 'div-table-col div-table-col-left'
            }).append($('<span>', {
            class: 'leftcol',
            text: sub.title
        })));

        subDiv.append($('<div>',
            {class: 'div-table-col div-table-col-right'}));

        return subDiv;
    },


    displayPanelCheckbox: function (div, sub, customClass) {
        customClass = customClass || "";
        if (sub.type !== 'checkbox') {
            return;
        }

        var subDiv = searchbox.displayPanelOptionTitle(sub, customClass);
        var subDivInput = $('<input>', {
            type: 'checkbox',
            id: sub.name,
            value: 1
        });
        if (sub.placeholder === "checked") {
            subDivInput.prop("checked", true);
        }
        subDiv.find('.div-table-col-right').append(subDivInput);
        div.append(subDiv);
    },


    displayPanelGrouplabel: function (div, sub, customClass) {
        customClass = customClass || "";
        if (sub.type !== 'grouplabel') {
            return;
        }
        var visibility = (sub.size === "hidden" ? "hidden" : "visible");
        div.append("<div id='" + sub.name + "' class='div-table-grouplabel " + customClass + "' style='visibility:" + visibility + "'>" + sub.title + "</div>");
    },


    displayPanelInput: function (div, sub) {
        if (sub.type !== 'input') {
            return;
        }

        var subDiv = searchbox.displayPanelOptionTitle(sub);
        var subDivInput = $('<input>', {
            class: 'fts_options_input fts_options_input_' + sub.size,
            type: 'text',
            placeholder: sub.placeholder,
            id: sub.name
        });
        subDiv.find('.div-table-col-right').append(subDivInput);
        div.append(subDiv);
    },


    getSearchOptions: function () {
        var options = {};

        if (box_elements.searchTemplate === null) {
            return options;
        }

        box_elements.searchOptions.find('INPUT').each(function () {
            searchbox.getSearchOptionsFromInput($(this), options);
        });
        box_elements.searchTemplate.find('INPUT').each(function () {
            searchbox.getSearchOptionsFromInput($(this), options);
        });

        return options;
    },


    getSearchOptionsFromInput: function (div, options) {
        var value = div.val();

        if (div.attr('type') === 'checkbox' && !div.is(':checked')) {
            value = '';
        }

        options[div.attr('id')] = value;
    },

    appendFilterOption: function (filterDiv, categoryKey, valueLabel, valueKey, count, checked) {
        searchbox.displayPanelCheckbox(filterDiv,
            {
                type: "checkbox", title: valueLabel + " (" + count + ")",
                name: '{"filter": {"' + categoryKey + '": "' + valueKey + '"}}',
				placeholder: checked ? "checked" : ""
            },
            "filter-option");
    },

    manageDivProviderOptionPanel: function (request, aggregations, selectedOptions) {
        var aggregationsContainer = $("#aggregations_container");
        $(".filter-option").remove();

        var filterDiv = aggregationsContainer.parent();

        Object.keys(aggregations).forEach(function (categoryKey, index) {
            var title = categoryKey
				.replace("metadata.", "")
				.replace("tags.", "")
				.replace("_date", "")
				.replace("_string", "");
            title = title.charAt(0).toUpperCase() + title.slice(1);
            searchbox.displayPanelGrouplabel(filterDiv, {type: 'grouplabel', name: categoryKey, title: title}, "filter-option");
            var aggregationsForKey = aggregations[categoryKey];
            for (var i = 0; i < aggregationsForKey.length; i++) {
				var agg = aggregationsForKey[i];
				var valueKey = agg['valueKey'];

				var checked = false;
				for (var k = 0; k < selectedOptions.length && !checked; k++) {
					if (categoryKey === selectedOptions[k]["categoryKey"] && valueKey === selectedOptions[k]["valueKey"] ) {
						checked = true;
					}
				}
				searchbox.appendFilterOption(filterDiv,
                    categoryKey,
                    agg['valueLabel'],
                    valueKey,
                    agg['count'],
					checked)
            }
        });

		box_elements.searchOptions.find('INPUT').each(function () {
			searchbox.eventOnOptionsLoadedInput($(this));
		});
    }

};


