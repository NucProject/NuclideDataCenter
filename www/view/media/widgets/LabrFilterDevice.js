

$class("LabrFilterDevice", DeviceBase,
    {
        __constructor: function() {
            this._deviceType = "labrfilter";

        },

        onAttach: function(domNode) {
            this.__super(DeviceBase.prototype.onAttach, [domNode]);

            this._dataListView.setHeaders([
                {'key':'time', 'name':'时间'},
                {'key':'starttime', 'name':'开始时间'},
                {'key':'endtime', 'name':'结束时间'},
                {'key':'doserate', 'name':"剂量率"},
                {'key':'temperature', 'name':'温度'},
                {'key':'highvoltage', 'name':'高压'},
                {'key':'bgsimilarity', 'name':'本底相似度'},
                {'key':'cps', 'name':'cps'},
                {'key':'handle', 'name':'操作', 'type': 'url'}
            ]);

            var this_ = this;
            this._dataListView._domNode.delegate('a', 'click', function (e) {
                var _e = e.target || e.srcElement;
                var _time = _e.parentNode.parentNode.children[0].innerHTML;
                this_.ajax('data/fetchLabrEnergyData/' + g.getCurrentStationId(), {'time':_time}, function (data) {
                    //console.log([data.length === 2]);
                    var _j = (data.length === 2) ? {} : JSON.parse(data);
                    this_.showEnergyChart(_j);
                });
            });
        },



        showChartsTab: function() {
            this._chartInterval = 30 * 10000;
            this._step = 30 * 10000;
            this.updateCharts();
        },

        updateCharts: function() {
            var start = g.getBeginTime().getTime();
            var end = g.getEndTime().getTime();

            var max = 10;
            var min = -10;
            var interval =  this._chartInterval || 30 * 10000;
            var this_ = this;
            this.showCharts(this._domNode,
                {
                    selector: "div.charts",
                    title: "剂量率",
                    ytitle: "剂量率",
                    start: start,
                    end: end,
                    max:max,
                    min:min,
                    interval: interval,
                    filter: kx.bind(this_, 'filter1')
                });

        },

        filter1: function(data) {
            this._chartInterval = 30 * 10000;
            this._step = 30 * 10000;
            var result =  this.chartFilterData(data, 'doserate', this._chartInterval, this._step);
            return result;

        },


        showEnergyChart: function(datastr){
            var this_= this;
            var data = datastr['data'];
            var n = datastr['nuclide'];
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

            nuclideArray = [];
            for(var i in n) {
                var energy = n[i]['energy'];
                var start = parseFloat(energy) - 20;
                var end = parseFloat(energy) + 20;
                var r = [];
                for (var j in datas)
                {
                    if (( datas[j][0] >= start) && ( datas[j][0] <= end))
                    {
                        r.push(datas[j]);
                    }
                }

                nuclideArray.push({
                    'name': n[i]['name'],
                    'activity': n[i]['activity'],
                    'energy': n[i]['energy'],
                    'data': r
                });
            }
            this_._domNode.find('#li_labr_filter_chart_energy').trigger("click");
            this_.createEnergy(this._domNode,{
                selector: "div.charts-energy",
                title: "能谱图",
                ytitle: "",
                start: 0,
                end: 3000,
                data:datas,
                nuclides: nuclideArray
            });
            this_._domNode.find('#li_labr_filter_chart_energy').trigger("click");



        },

        decorateList: function ()
        {
            var t = '<a class="btn blue show" style="word-break: keep-all;white-space: nowrap">显示能谱</a>';
            this._dataListView.addColumnData('td:last', t);
        },



        onChartIntervalChanged: function(sender) {
            if (sender.hasClass('m5')) {
                this._chartInterval = 30 * 10000;
            } else if (sender.hasClass('s30')) {
                this._chartInterval = 30 * 1000;
            } else if (sender.hasClass('h1')) {
                this._chartInterval = 3600 * 1000;
            }else if (sender.hasClass('d1')) {
                this._chartInterval = 24*3600 * 1000;
            }
            else {
                // 5min as default;
                this._chartInterval = 30 * 10000;
            }

            this.updateCharts();

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
                var name = n['name'];
                series.push({
                    name: name,
                    data: n['data'],
                    fillColor: colors[name],
                    color: colors[name]

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
                            symbol: 'circle',
                            radius: 2,
                            states: {
                                hover: {
                                    enabled: true,
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
                    {'key':'activity', 'name':'活度'},
                    {'key':'energy', 'name':'能量'}
                ]);
            }

            var params = this._nuclideList.clearValues();

            var nuclides = p.nuclides;
            for (var i in nuclides)
            {

                var n = nuclides[i];
                console.log(n);
                var name = n['name'];
                this._nuclideList.addValue({'name': name, 'activity': n['activity'], 'energy': n['energy']}, params)
            }

        }
    });
