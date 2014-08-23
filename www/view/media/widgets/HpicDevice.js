/**
 * Created by Healer on 14-8-23.
 */
$class("HpicDevice", DeviceBase,
{
    __constructor: function() {
        this._deviceType = "hpic";
    },

    onAttach: function(domNode) {
        console.log(domNode)
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
        setTimeout(function(){
            this_.showCharts(this_._domNode, {
                selector: "div.charts",
                title: "剂量率", ytitle: "剂量率",
                filter: kx.bind(this_, 'filter')
            });
        }, 500);


    },

    filter: function(data) {
        return this.chartFilterData(data, 'doserate');
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
    }

});

