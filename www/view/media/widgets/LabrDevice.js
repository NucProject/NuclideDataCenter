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
            {'key':'doserate', 'name':'总剂量率', type: 'num'},
            {'key':'starttime', 'name':'开始时间'},
            {'key':'endtime', 'name':'结束时间'},
            {'key': 'refnuclidefound', 'name':"发现核素", 'type': 'bool'},
            {'key':'N42path', 'name':'链接', 'type': 'url'}]
        );
    },

    showChartsTab: function() {

        this.showCharts(this._domNode, {
            selector: "div.charts",
            title: "剂量率", ytitle: "剂量率",
            filter: this.filter
        });
    },

    filter: function(data) {
        var a = [];

        for (var i in data) {
            var n = data[i]['doserate'];
            a.push(parseFloat(n));
        }

        return {'data':a};
    }
});

