/**
 * Created by yuzhongmin on 14-6-5.
 */
$class("StationTabPane", [kx.Widget, kx.ActionMixin, kx.EventMixin],
{
    __constructor: function() {


    },

    onAttach: function(domNode) {

        var this_ = this;
        setInterval(function(){

            this_.onQueryOnline(domNode);
        }, 10000);
        this_.onQueryOnline(domNode);

    },

    onQueryOnline: function(domNode) {
        var stationStatusNode = domNode.find('div.caption span.offline');
        stationStatusNode.text("(在线)")
    }

});