/**
 * User: rnugraha
 * Date: 12/27/12
 * Time: 3:30 PM
 */

$(document).ready(function() {

	/* Action buttons
	 ----------------------------------*/
	var Button = Backbone.Model.extend({});
	var ButtonList = Backbone.Collection.extend({
		model: Button
	});
	var ButtonView = Backbone.View.extend({
		tagName: "button",

		initialize: function() {
			_.bindAll(this, "resetBasket", "submitOrder");
		},

		resetBasket: function() {
			// invoke basketView reset
			this.options.parent.collection.reset();
		},

		submitOrder: function() {
			console.log(" ************** Following will be submitted **************");
			console.log(this.options.parent.collection.toJSON());
			console.log(" *********************************************************");
		},

		render: function () {
			var view = this;
			$( this.el ).button({label: this.model.get('label')})
				.click(function (event, ui) {
					// associate action to rendered button
					view[view.model.get('action')]();
				});
			return this;
		}
	});
	var ButtonListView = Backbone.View.extend({
		el: $("#buttonList"),
		initialize: function(){
			_.bindAll(this, "renderButton");
		},
		renderButton: function(model) {
			var buttonView = new ButtonView({model: model, parent:this.options.parent});
			buttonView.render();
			$(this.el).append(buttonView.el);
		},
		render: function () {
			this.collection.each(this.renderButton);
		}
	});

	/* Product Category
	 ----------------------------------*/
	var Category = Backbone.Model.extend({});
	var CategoryCollection = Backbone.Collection.extend({
		model: Category,
		comparator: function (category)
		{
			return category.get("category_id");
		}
	});
	var CategoryView = Backbone.View.extend({
		el: $('#categories'),
		template: $('#prod-cat-tmpl').template(),
		render: function(){

			$( "#categories" ).selectable({
				selected: function (event, ui) {
					$("#productList").empty();

					var items = new ItemCollection;

					// get JSON data based on selected category
					items.url =  "data/" + $(".ui-selected").attr('label') + "_data.json";
					items.fetch({async: false}); // fetch synchronously

					// render products based on selected category
					var itemViewList = new ItemViewList({collection: items});
					itemViewList.render();
				}
			});

			$.tmpl(this.template, this.model.toArray()).appendTo(this.el);
			return this;
		}
	});

	/* Product Item
	 ----------------------------------*/
	var Item = Backbone.Model.extend({});
	var ItemCollection = Backbone.Collection.extend({
		model: Item,

		parse: function(response) {
			return response;
		},

		comparator: function (product)
		{
			return product.get("category_id");
		}
	});
	var ItemViewList = Backbone.View.extend({
		el: $('#productList'),
		initialize: function(){
			_.bindAll(this, "renderItem");
		},
		renderItem: function(model){
			var itemView = new ItemView({model: model});
			itemView.render();
			$(this.el).append(itemView.el);
		},
		render: function() {
			this.collection.each(this.renderItem);
		}
	});
	var ItemView = Backbone.View.extend({
		className: 'ui-widget-content draggable',
		template: $('#prod-item-tmpl').template(),
		initialize: function () {
			$(this.el).draggable({
				helper: 'clone',
				opacity: 0.65
			});
			$(this.el).data("backbone-view", this);
		},
		render: function() {
			var html = $.tmpl(this.template, this.model);
			$(this.el).append(html);
			return this;
		}
	});

	/* Order
	 ----------------------------------*/
	var TotalPriceView = Backbone.View.extend({
		el: "#totalPrice",
		template: $('#total-price-tmpl').template(),
		initialize: function () {
			_.bindAll(this, 'removeTotalPrice');
		},
		removeTotalPrice: function () {
			$(this.el).empty();
		},
		render: function () {
			var _totalPrice = this.collection.totalPrice;
			$(this.el).empty();
			$.tmpl(this.template, {totalPrice: _totalPrice}).appendTo(this.el);
			return this;
		}
	});

	var OrderItems = Backbone.Collection.extend({
		model: Item,
		initialize: function () {
			_.bindAll(this, "totalPrice");
		},
		totalPrice: function () {
			return this.reduce(function(memo, value) { return memo + value.get("price") }, 0);
		}
	});

	var OrderItemView = Backbone.View.extend({
		tagName: 'li',
		template: $('#order-item-tmpl').template(),
		events: {
			"click .removeItem"   : "removeItem"
		},
		removeItem: function () {
			this.model.destroy();
		},
		render: function() {
			var _this = this;
			var _id = 'order_item_' + _this.model.get('category') + '_' + _this.model.get('product_id') + '_' +  _this.model.cid;

			$(this.el).append($.tmpl(this.template, _this.model)).appendTo('#orderedProducts');
			$(this.el).attr('id', _id);
			$(".removeItem").button({
				icons: {
					primary: "ui-icon ui-icon-circle-close"
				},
				text: false
			});
			return this;
		}
	});

	var OrderItemViewList = Backbone.View.extend({
		el: $("#orderedProducts"),
		totalView: null,
		initialize: function () {
			_.bindAll(this, "render","addItem","removeItem","emptyBasket");
			this.collection.bind("add", this.addItem);
			this.collection.bind("remove", this.removeItem);
			this.collection.bind("reset", this.emptyBasket);
			// generate total price
			this.totalView = new TotalPriceView({collection: this.collection});
		},
		emptyBasket: function() {
			$('#explanationTxtFrame').removeClass('hidden').addClass('showed');
			this.totalView.removeTotalPrice();
			$(this.el).empty();
		},
		addItem: function(item) {
			var itemView = new OrderItemView({model: item});
			itemView.render();
			this.totalView.render();
		},
		removeItem: function(item) {
			var _id = 'order_item_' + item.get('category') + '_' + item.get('product_id') + '_' + item.cid;
			$('#'+ _id).remove();
			this.totalView.render();
			// remove total price view & show desc if basket empty
			if (this.collection.length < 1) {
				this.totalView.removeTotalPrice();
				$('#explanationTxtFrame').removeClass('hidden').addClass('showed');
			}
			console.log(this.collection.toJSON());
		},
		render: function () {
			var _view = this;
			$(_view.el).closest('div').droppable({
				tolerance: 'pointer',
				over: function( event, ui ) {
					$( this ).addClass( "basketHighlight" );
				},
				drop: function( event, ui ) {
					$( this ).removeClass( "basketHighlight" );
					$('#explanationTxtFrame').removeClass('showed').addClass('hidden');

					// get dropped model
					var model = $(ui.draggable).data("backbone-view").model;

					// then insert its clone to the order collection
					_view.collection.add(model.clone());
					console.log(_view.collection.toJSON());

					_view.totalView.render();
				}
			});
		}
	});

	/* Application Router
	----------------------------------*/
	var AppRouter = Backbone.Router.extend({
		_cat_data: null,
		_cat_items: null,
		_cat_view: null,

		_basket_items:null,
		_basket_view: null,

		_buttons_array: [{id:"resetButton", label:"Reset", action:"resetBasket"},
						 {id:"submitButton", label:"Submit", action:"submitOrder"}],
		_buttons_list: null,
		_buttons_view: null,
		initialize: function (options)
		{
			var _this = this;
			$.ajax({
				url: "data/ProductCategories_data.json",
				dataType: 'json',
				data: {},
				async: false,
				success: function (data)
				{
					_this._cat_data = data;
					_this._cat_items = new CategoryCollection(data);
					_this._cat_view = new CategoryView({ model: _this._cat_items });
					_this._cat_view.render();

					_this._basket_items = new OrderItems;
					_this._basket_view = new OrderItemViewList({collection:_this._basket_items});
					_this._basket_view.render();

					// render buttons
					_this._buttons_list = new ButtonList(_this._buttons_array);
					_this._buttons_view = new ButtonListView({ collection: _this._buttons_list, parent: _this._basket_view});
					_this._buttons_view.render();

					Backbone.history.loadUrl();
				}
			});

			return this;
		}
	});

	var appRouter = new AppRouter;

	Backbone.history.start();
});