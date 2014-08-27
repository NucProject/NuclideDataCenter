/**
 * Created by Healer on 14-8-23.
 */


$class("CinderellaDevice", DeviceBase,
{
    __constructor: function() {
        this._deviceType = "cinderelladata";
    },

    onAttach: function(domNode) {
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

        this._dataListView.setHeaders([
            {'key':'time', 'name':'时间'},
            {'key':'Sid', 'name':'采样ID'},
            {'key':'barcode', 'name':'条 码'},
            {'key':'BeginTime', 'name':'开始时间'},
            {'key':'Flow', 'name':"流量"},
            {'key':'FlowPerHour', 'name':'瞬时流量'},
            {'key':'Pressure', 'name':'气压'}]);

    },

    fillListDefault: function(page) {
        this.fillList(page)
    }
});
