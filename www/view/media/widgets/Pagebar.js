
$class("Pagebar", [kx.Weblet, kx.EventMixin], 
{
	_templateFile: "pagebar.html",

	_currentPage: 1,

	__constructor: function(pageCount) {
        this._pageCount = pageCount;
	},

	onCreated: function(domNode) {
        var t = domNode.find('li.template');
        var f = domNode.find('li.template');
        t.removeClass('template')
        for (var i = 2; i <= this._pageCount; i += 1) {
            var n = t.clone();
            n.attr('data-lp', i).find('a').text(i);
            f.after(n);
            f = n;
        }
		domNode.find("li").bind("click", kx.bind(this, "pageClicked"));
	},

	pageClicked: function(e) {

		this._currentPage = $(e.delegateTarget).attr('data-lp');
        this._obj.fireEvent(this._event, this._currentPage);

    },

	currentPage: function() {
		return this._currentPage;
	},

    setPageEvent: function(obj, event) {
        this._event = event;
        this._obj = obj;
    }

});