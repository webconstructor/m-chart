var m_chart_chartjs_helpers = {
	locale: 'en-US'
};

(function( $ ) {
	'use strict';

	// Start things up
	m_chart_chartjs_helpers.init = function() {
		$( '.m-chart' ).on( 'render_start', function( event ) {
			var chart_object = 'm_chart_chartjs_' + event.post_id + '_' + event.instance;

			if ( 'undefined' === typeof window[chart_object] ) {
				return;
			}

			m_chart_chartjs_helpers.locale = window[chart_object].chart_args.options.locale;

			var type = window[chart_object].chart_args.type;

			var value_prefix = window[chart_object].chart_args.value_prefix;
			var value_suffix = window[chart_object].chart_args.value_suffix;

			if ( 'bubble' == window[chart_object].chart_args.type ) {
				window[chart_object].chart_args.data = m_chart_chartjs_helpers.preprocess_bubble_data( window[chart_object].chart_args.data );
				window[chart_object].chart_args.options.plugins.tooltip.callbacks = {
					label: (item) => {
	                	return m_chart_chartjs_helpers.bubble_chart_tooltip_label( item, type, value_prefix, value_suffix );
	                }
				}
			} else if ( 'scatter' == window[chart_object].chart_args.type ) {
				window[chart_object].chart_args.options.plugins.tooltip.callbacks = {
					label: (item) => {
	                	return m_chart_chartjs_helpers.scatter_chart_tooltip_label( item, type, value_prefix, value_suffix );
	                }
				}
			} else {
				window[chart_object].chart_args.options.plugins.tooltip.callbacks = {
					label: (item) => {
	                	return m_chart_chartjs_helpers.chart_tooltip_label( item, type, value_prefix, value_suffix );
	                }
				}
			}

			window[chart_object].chart_args.options.plugins.datalabels.formatter = function( label ) {
				// If there's no label we stop here
				if ( null === label ) {
					return label;
				}

				// Handling for Bubble/Scatter Charts
				if ( 'undefined' !== typeof label.label ) {
					label = label.label;
				} else if ( 'undefined' !== typeof label.r ) {
					label = label.r;
				} else if ( 'undefined' !== typeof label.y ) {
					label = label.y;
				}

				if ( $.isNumeric( label ) ) {
					return m_chart_chartjs_helpers.number_format( label );
				} else {
					return label;
				}
			};
		});
	};

	// Preprocess bubble chart data so bubble size is controlled but still relative to value
	// See https://chartio.com/learn/charts/bubble-chart-complete-guide/#scale-bubble-area-by-value
	m_chart_chartjs_helpers.preprocess_bubble_data = function( $data ) {
		const value_range = $data.datasets[0].data.reduce((acc, val) => Math.max(acc, val.r), 0);
		const pixel_max   = 31;
		const pixel_min   = 1;
		const pixel_range = pixel_max - pixel_min;

		for ( const ds of $data.datasets ) {
			for ( const d of ds.data ) {
				d.original = d.r;

				const percentage_radius = Math.sqrt( Math.abs(d.r) / value_range );
				d.r = percentage_radius * pixel_range + pixel_min;
			}
		}

		return $data;
	};

	m_chart_chartjs_helpers.bubble_chart_tooltip_label = function( item, type, prefix, suffix ) {
		var tooltip_label = [
			item.raw.label,
			item.chart.data.labels[0] + ': ' + m_chart_chartjs_helpers.number_format( item.parsed.x ),
			item.chart.data.labels[1] + ': ' + m_chart_chartjs_helpers.number_format( item.parsed.y ),
			item.chart.data.labels[2] + ': ' + m_chart_chartjs_helpers.number_format( item.raw.original ),
		];

		return tooltip_label;
	};

	m_chart_chartjs_helpers.scatter_chart_tooltip_label = function( item, type, prefix, suffix ) {
		var tooltip_label = [
			item.dataset.label,
			item.chart.data.labels[0] + ': ' + m_chart_chartjs_helpers.number_format( item.parsed.x ),
			item.chart.data.labels[1] + ': ' + m_chart_chartjs_helpers.number_format( item.parsed.y ),
		];

		return tooltip_label;
	};

	m_chart_chartjs_helpers.chart_tooltip_label = function( item, type, prefix, suffix ) {
		var label = item.dataset.label;

		// If raw value is null we don't return anything
		if ( null == item.raw ) {
			return null;
		}

		// Depending on the chart type or data format the label is usually in one of two places
		if ( 'undefined' == typeof label ) {
			label = item.label;
		}

		// Bar tooltips already get the label in the tooltip title
		if ( 'bar' == type ) {
			label = '';
		}

		// Polar charts put the label in a strange place
		if ( 'polarArea' == type ) {
			label = item.chart.data.labels[ item.dataIndex ];
		}

		if ( '' != label ) {
			label += ': ';
		}

		var tooltip_label = label + prefix + m_chart_chartjs_helpers.number_format( item.raw ) + suffix;

		return tooltip_label;
	};

	m_chart_chartjs_helpers.number_format = function( number ) {
		return Chart.helpers.formatNumber( number, m_chart_chartjs_helpers.locale );
	};

	$( function() {
		m_chart_chartjs_helpers.init();
	} );
})( jQuery );