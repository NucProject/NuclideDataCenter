/**
* Created by Healer on 14-8-23.
*/


$class("LabrDevice", DeviceBase,
{
    __constructor: function() {
        this._deviceType = "labr";
        this._exceptTotal = 288;
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
            this_.showEnergyChartFromList(tr);
        });

    },

    onShow: function()
    {
        this._currentShownDevice = this._deviceType;

        var payload = {
            start: g.getBeginTime('yyyy-MM-dd'),
            end: g.getEndTime('yyyy-MM-dd'),
            interval: 300
        };
        console.log(33333333)
        this.fetchData(payload, 1);
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
        var t = '<a class="btn blue mini show" style="word-break: keep-all;white-space: nowrap">显示</a>';
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
            ytitle: "剂量率 （nSv/h）",
            start: start,
            end: end,
            max:max,
            min:min,
            interval: interval,
            filter: kx.bind(this_, 'filter'),
            tooltip: kx.bind(this_, 'tooltip')
        });
    },

    tooltip: function(x, y)
    {
        var this_ = this;
        var time = Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', x);
        f1 = function() {
            this_.showEnergyChartByTime(time);
        };

        var text = '<b>' + Highcharts.numberFormat(y, 2) + '</b>' + '&nbsp;<a href="javascript:void(0)" onclick="f1()" class="show-energy-charts">显示能谱图</a>' + '<br/>' + time;


        return text;
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

    showEnergyChartByTime: function (time) {
        var this_ = this;
        this.ajax('download/energy2/' + g.getCurrentStationId() , {'time': time}, function (data) {
            // console.log(data);
            this_.showEnergyChart(data);
        });
    },

    showEnergyChartFromList: function (tr) {
        var href = tr.find('td.download a').attr('href');
        var this_ = this;
        this.ajax('download/energy' + href, {'path': href}, function (data) {
            //console.log(data);
            this_.showEnergyChart(data);
        });
    },

    showEnergyChart: function (dataStr) {
        var this_ = this;
        var d = eval('('+dataStr+")");
        if (d['errorCode'] != 0)
            return;
        //console.log(dataStr);
        var data = d['results']['data'];
        //console.log(data)
        var n = d['results']['nuclides'];
        console.log(n)
        var items = data.split(';');
        var datas = [];
        for (var i in items)
        {
            var p = items[i];
            var d = p.split(',');
            var x = parseFloat(d[0]);
            var y = parseInt(d[1]);

            var item = [x, y];
            datas.push(item);
        }

        nuclideArray = []
        for (var i in n)
        {
            var min = n[i]['c1'];
            var max = n[i]['c2'];
            // console.log(min, max);
            var start = false;
            var r = [];
            for (var j in datas)
            {
                if (datas[j][0] == min)
                {
                    start = true;
                }
                else if (datas[j][0] == max)
                {
                    break;
                }

                if (start)
                {
                    r.push(datas[j]);
                }
            }

            nuclideArray.push({
                'nuclide': n[i]['nuclide'],
                'ind': n[i]['ind'],
                'doserate': n[i]['doserate'],
                'data': r});
        }

        this_._domNode.find('#li_labr_chart_energy').trigger("click");
        this_.createEnergy(this._domNode,
            {
                selector: "div.charts-energy",
                title: "能谱图",
                ytitle: "",
                start: 0,
                end: 3000,
                data:datas,
                nuclides: nuclideArray

            }
        );
        this_._domNode.find('#li_labr_chart_energy').trigger("click")
    },

    createEnergy: function(domNode, p) {
        var this_ = this;
        var items = p.data;
        var selector = p.selector;

        var series = [];
        series.push({
            name: 'a',
            data: items,
            turboThreshold: 0,
            fillColor: 'rgba(255, 255, 255, 0)'

        });

        var colors = {
            'Co-60': 'rgba(200, 0, 0, .50)',
            'I-133': 'rgba(0, 255, 0, .50)',
            'K-40': 'rgba(0, 255, 0, .50)',
            '': 'rgba(255, 255, 255, 0)',
            '': 'rgba(255, 255, 255, 0)',
            '': 'rgba(255, 255, 255, 0)',
            '': 'rgba(255, 255, 255, 0)'
        }

        var nuclides = p.nuclides;
        for (var i in nuclides)
        {
            var n = nuclides[i];
            var name = n['nuclide'];
            series.push({
                name: name,
                data: n['data']
                //fillColor: colors[name],
                //color: colors[name]

            });
        }

        var names = [];
        this.detailsChart = domNode.find(selector).css('width', '100%').highcharts({
            chart: {
                marginBottom: 80,
                reflow: true,
                marginLeft: 70,
                marginRight: 20,
                turboThreshold: 0,
                zoomType:"x",
                type:'areaspline'
                /*
                events: {
                        redraw: function() {
                            this_.updateMark(p);
                        }

                }*/
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
                    return '[能量:<b>' + this.x + 'keV</b> 计数:<b>' +  point.y + '</b>]';
                },
                shared: true
            },
            legend: {
                enabled: true,
                layout: 'vertical',
                align: 'left',
                verticalAlign: 'top',
                x: 150,
                y: 100,
                floating: true,
                borderWidth: 1,
                backgroundColor: '#FFFFFF',

                labelFormatter: function () {
                    if (this.name == 'a') return '';

                    if (names.indexOf(this.name) >= 0) {

                        return this.name + '(2) &nbsp';
                    }
                    names.push(this.name)
                    return this.name + '&nbsp';
                },
                useHTML: true
            },
            plotOptions: {
                series: {
                    name:'a',
                    lineWidth: 1.0,

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
                shadow: false,
                area:{ turboThreshold: 10000}
            },
            series: series,

            exporting: {
                enabled: false
            }
        }).highcharts();

        this.updateMarkList(p);
    },

    updateMarkList: function (p) {
        if (!this._nuclideList) {
            this._nuclideList = new ListView();
            this._nuclideList.create().appendTo(this._domNode.find('div.nuclide-list'));

            this._nuclideList.setHeaders([
                // {'key':'id', 'type': 'id'},
                {'key':'name', 'name': '核素'},
                {'key':'doserate', 'name':'剂量率'},
                {'key':'ind', 'name':'置信度'}
            ]);
        }

        var params = this._nuclideList.clearValues();

        var nuclides = p.nuclides;
        for (var i in nuclides)
        {

            var n = nuclides[i];
            console.log(n);
            var name = n['nuclide'];
            var doserate = parseFloat(n['doserate']) * 1000;
            this._nuclideList.addValue({'name': name, 'ind': n['ind'], 'doserate': doserate}, params)
        }

    },

    updateMark: function (p) {
        /*
        var nuclides = p.nuclides;
        for (var i in nuclides)
        {
            var n = nuclides[i];
            var x = n['data'][0][0];
            var y = n['data'][0][1];
            this.addNuclideMark(this.detailsChart, x, y, n['nuclide']);
        }*/
    },

    // 暂时不做核素区域附近的标注(暂时没有处理好缩放的标注Box删除)
    addNuclideMark: function(chart, x, y, name)
    {
        var px = 0, py = 0;
        for (var i in chart.series[0].data)
        {
            var d = chart.series[0].data[i];
            if (d['x'] == x)
            {
                px = d['plotX'];
                py = d['plotY'];
                break;
            }
        }
        // var chart = this.detailsChart;

        var text = chart.renderer.text(
            name, //获取数据点在X轴对应的刻度值
            px + 70, py
            //point.plotX + chart.plotLeft + 10,

            //point.plotY + chart.plotTop - 10
        ).attr({

                zIndex: 5

            }).add();

        var box = text.getBBox();
        chart.renderer.rect(box.x - 5, box.y - 5, box.width + 10, box.height + 10, 5)
            .attr({
                'fill': '#FFFFEF',
                'stroke': 'gray',
                'stroke-width': 1,
                'zIndex': 4
            })
            .add();
    },

    onAlertLevelSelectChanged: function(e) {

        var value = $(e.delegateTarget).val();
        this.fetchAlerts(value, 1);
    },

    onTabChanged: function(tabItem) {
        if (tabItem.hasClass('alerts'))
        {
            var w = this._domNode.find('.alert-select');
            w.val(1);
            w.trigger('change');
        }
    }

});

