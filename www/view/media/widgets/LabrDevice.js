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
            {'key': 'refnuclidefound', 'name':"找到参考核素", 'type': 'bool'},
            {'key':'N42path', 'name':'链接', 'type': 'url'}]
        );
    },

    showChartsTab: function() {
        this.updateCharts();
    },

    filter: function(data) {
        var a = [];

        for (var i in data) {
            var n = data[i]['doserate'];
            a.push(parseFloat(n));
        }

        return {'data':a};
    },

    fillListDefault: function(page) {
        this.fillList(page)
    },

    updateCharts: function() {
        this.showCharts(this._domNode, {
            selector: "div.charts",
            title: "剂量率", ytitle: "剂量率",
            filter: this.filter
        });
    }
});

