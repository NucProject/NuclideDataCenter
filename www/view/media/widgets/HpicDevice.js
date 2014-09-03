/**
 * Created by Healer on 14-8-23.
 */
$class("HpicDevice", DeviceBase,
{
    __constructor: function() {
        this._deviceType = "hpic";
    },

    onAttach: function(domNode) {
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

        this._dataListView.setHeaders([
            {'key':'time', 'name':'时间'},
            {'key':'doserate', 'name':'剂量率', type: 'num'},
            {'key':'battery', 'name':'电池', type: 'num'},
            {'key':'highvoltage', 'name':'电压', type: 'num'},
            {'key':'temperature', 'name':'温度', type: 'num'}]);

    },

    showChartsTab: function() {
        var this_ = this;
        this._chartInterval = 30 * 10000;
        setTimeout(function(){
            this_.updateCharts();
        }, 0);
        //this.updateCharts();
    },

    updateCharts: function() {
        var start = g.getBeginTime().getTime();
        var end = g.getEndTime().getTime();

        var interval =  this._chartInterval || 30 * 10000;
        this.showCharts(this._domNode,
            {
                selector: "div.charts",
                title: "剂量率",
                ytitle: "剂量率",
                start: start,
                end: end,
                max:150, min:40,
                interval: interval,
                filter: kx.bind(this, 'filter')
            }
        );
    },

    filter: function(data) {
        var currentField = 'doserate';
        return this.chartFilterData(data, currentField, this._chartInterval);
    },

    onTabChanged: function() {

    },

    onIntervalChanged: function(sender) {
        /*
        if (sender.hasClass('m5')) {
            this.fillList5min(this._items, 0);
        } else if (sender.hasClass('s30')) {
            this.fillList(this._items, 0);
        } else if (sender.hasClass('h1')) {
            this.fillList1Hour(this._items, 0);
        }
        */
    },

    onChartIntervalChanged: function(sender) {
        if (sender.hasClass('m5')) {
            this._chartInterval = 30 * 10000;
        } else if (sender.hasClass('s30')) {
            this._chartInterval = 30 * 1000;
        } else if (sender.hasClass('h1')) {
            this._chartInterval = 3600 * 1000;
        } else {
            // 5min as default;
            this._chartInterval = 30 * 10000;
        }

        this.updateCharts();

    }



});

