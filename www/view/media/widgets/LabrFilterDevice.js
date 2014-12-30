

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
            this._dataListView._domNode.delegate('a', 'click', function () {
                var tr = $(this).parent().parent();
                //this_.showEnergyChartFromList(tr);
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

            /*
             this.showCharts(this._domNode, {
             selector: "div.charts2",
             title: "气压", ytitle: "气压",
             filter: kx.bind(this, 'filter2')
             });
             */
        },

        filter1: function(data) {
            this._chartInterval = 30 * 10000;
            this._step = 30 * 10000;
            var result =  this.chartFilterData(data, 'doserate', this._chartInterval, this._step);
            return result;

        },

        filter2: function(data){
            this._chartInterval = 30 * 10000;
            this._step = 30 * 10000;
            var result =  this.chartFilterData(data, 'channeldata', this._chartInterval, this._step);
            return result;
        },

        filter3: function(data){
            this._chartInterval = 30 * 10000;
            this._step = 30 * 10000;
            var result =  this.chartFilterData(data, 'k1', this._chartInterval, this._step);
            return result;
        },

        filter4: function(data){
            this._chartInterval = 30 * 10000;
            this._step = 30 * 10000;
            var result =  this.chartFilterData(data, 'k0', this._chartInterval, this._step);
            return result;
        },

        showEnergyChartFromList: function(tr){
            var href = tr.find('td.download a').attr('href');
        },

        showEnergyChart: function(datastr){
            var this_ = this;
            var items = datastr.split(' ');
            var datas = [];
            console.log(datas);

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

        }
    });
