/**
* Created by Healer on 14-8-23.
*/


$class("LabrDevice", DeviceBase,
{
    __constructor: function() {
        this._deviceType = "labr";
    },

    onAttach: function(domNode) {
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

        this._dataListView.setHeaders([
            {'key':'time', 'name':'时间'},
            {'key':'doserate', 'name':'总剂量率（nSv/h）', type: 'num', accuracy: 4},
            {'key':'temperature', 'name':'探头温度（℃）', type: 'num'},
            {'key':'highvoltage', 'name':'探头高压（V）', type: 'num'},
            {'key':'starttime', 'name':'开始时间'},
            {'key':'endtime', 'name':'结束时间'},
            {'key':'refnuclidefound', 'name':"找到参考核素", 'type': 'bool'},
            {'key':'N42path', 'name':'链接', 'type': 'url', class: 'download'},
            {'key':'handle', 'name':'操作', 'type': 'url'}]
        );

        var this_ = this;
        this._dataListView._domNode.delegate('a', 'click', function () {
            var tr = $(this).parent().parent();
            this_.showEnergyChart(tr);
        });

    },

    showChartsTab: function() {
        this._chartInterval = 30 * 10000;
        this._step = 30 * 10000;
        this.updateCharts();
    },

    filter: function(data) {
        this._chartInterval = 30 * 10000;
        this._step = 30 * 10000;
        var result =  this.chartFilterData(data, 'doserate', this._chartInterval, this._step);

        return result;
    },

    fillListDefault: function(page) {
        this.fillList(page)

    },

    decorateList: function ()
    {
        var t = '<a class="btn blue show" style="word-break: keep-all;white-space: nowrap">显示</a>';
        this._dataListView.addColumnData('td:last', t);
    },

    /*
    fixValue: function(v) {
        v['doserate'] = 1000 * v['doserate'];
        return this.__super(DeviceBase.prototype.fixValue, [v]);
    },*/

    updateCharts: function() {
        var start = g.getBeginTime().getTime();
        var end = g.getEndTime().getTime();

        console.log(start, end)

        var max = 10;
        var min = -10;
        var interval =  this._chartInterval || 30 * 10000;
        var this_ = this;
        this.showCharts(this._domNode, {
            selector: "div.charts",
            title: "剂量率",
            ytitle: "剂量率",
            start: start,
            end: end,
            max:max,
            min:min,
            interval: interval,
            filter: kx.bind(this_, 'filter')
        });


    },

    onChartIntervalChanged: function(sender) {
        if (sender.hasClass('m5')) {
            this._chartInterval = 30 * 10000;
        } else if (sender.hasClass('s30')) {
            // this._chartInterval = 30 * 1000;
        } else if (sender.hasClass('h1')) {
            this._chartInterval = 3600 * 1000;
        } else {
            // 5min as default;
            this._chartInterval = 30 * 10000;
        }

        this.updateCharts();

    },

    showEnergyChart: function (tr) {
        var href = tr.find('td.download a').attr('href');
        var this_ = this;
        this.ajax('download/energy' + href, {'path': href}, function (data) {
            var items = data.split(',');

            for (var i in items)
            {
                items[i] = parseInt(items[i]);
            }
            this_.createEnergy(this._domNode,
                {
                    selector: "div.charts-energy",
                    title: "能谱图",
                    ytitle: "",
                    start: 0,
                    end: 3000,
                    data:items

                }
            );

            // console.log(this_._domNode.find('#li_labr_chart_energy'))

            this_._domNode.find('#li_labr_chart_energy').trigger("click")
        });
    },


    createEnergy: function(domNode, p) {


        var this_ = this;
        var items = p.data;
        var selector = p.selector;
        this.detailsChart = domNode.find(selector).css('width', '100%').highcharts({
            chart: {
                marginBottom: 80,
                reflow: true,
                marginLeft: 70,
                marginRight: 20,
                turboThreshold: 0
            },
            credits: {
                enabled: false
            },
            title: {
                text: p.title
            },
            subtitle: {
                text: ''
            },
            xAxis: {
                tickInterval:200,
                tickPixelInterval:100
            },
            yAxis: {
                title: {
                    text: p.ytitle
                }
                //maxZoom: 0.1,
                //max: p.max,
                //min: p.min
            },
            tooltip: {
                formatter: function() {

                    var point = this.points[0];
                    // [能量:{0}（keV） 计数:{1}]
                    return '[能量:<b>' + this.x + '</b> 计数:<b>' +  point.y + '</b>]';
                },
                shared: true
            },
            legend: {
                enabled: false
            },
            plotOptions: {
                series: {
                    marker: {
                        enabled: false,
                        states: {
                            hover: {
                                enabled: true,
                                radius: 2
                            }
                        }
                    }
                },

                area:{ turboThreshold: 10000}
            },
            series: [{
                name: '',
                data: items,
                turboThreshold: 0

            }],

            exporting: {
                enabled: false
            }
        }).highcharts();

    }
});

