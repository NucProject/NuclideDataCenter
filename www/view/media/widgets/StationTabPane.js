/**
 * Created by yuzhongmin on 14-6-5.
 */
// Deprecated
$class("StationTabPane", [kx.Widget, kx.ActionMixin, kx.EventMixin],
{
    templateString: "",

    __constructor: function() {


    },

    onAttach: function(domNode) {
        console.log(g.getCurrentStationName(), '!');
        domNode.find('div.caption i').text(g.getCurrentStationName())
    }

});