<?php

namespace App\Api\Controllers;

use App\Cart;
use App\Order;
use App\OrderItem;
use App\Product;
use Illuminate\Http\Request;
use Auth;
use DB;

class OrderController extends BaseController
{
    /**
     * @var Order
     */
    private $order;

    /**
     * @var OrderItem
     */
    private $orderItem;

    /**
     * @var Product
     */
    private $product;

    /**
     * @var Cart
     */
    private $cart;

    /**
     * OrderController constructor.
     *
     * @param Order     $order
     * @param OrderItem $orderItem
     * @param Product   $product
     * @param Cart      $cart
     */
    public function __construct(Order $order, OrderItem $orderItem, Product $product, Cart $cart)
    {
        $this->order = $order;
        $this->orderItem = $orderItem;
        $this->product = $product;
        $this->cart = $cart;
    }

    /**
     * 订单列表数据
     *
     * @return \Illuminate\Database\Eloquent\Collection|static[]
     */
    public function index()
    {
        return $this->order->where('user_id', Auth::id())->all();
    }

    /**
     * 订单详情
     *
     * @param $id
     *
     * @return mixed
     */
    public function show($id)
    {
        return $this->order->findOrFail($id);
    }

    /**
     * 结算，创建订单
     *
     * @param Request $request
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
       // 选中的购物车项
       $selectedCarts = $request->input('selectedCarts');

       if (count($selectedCarts) == 0) {
           return $this->response->error('未选择结算项目', 400);
       }

       $products = collect($request->tickets);

       $products = Product::whereIn('id', $products->pluck('id'))->lists('id');

       // attach price
       $products = collect($request->tickets)->map(function($product) use ($products) {
           $product['unit_price'] = $products[$product['id']];

           return $product;
       });

       $order = new Order([
           'total_fee'      => $products->reduce(function($carry, $item) {
               return $carry + ($item['amount'] * $item['unit_price']);
           }),
           'amount'         => $products->sum('amount'),
       ]);

       $items = [];

       foreach ($products as $product) {
           $items[] = new OrderItem([
               'order_id'     => $order->id,
               'product_id'   => $product['id'],
               'amount'       => $product['amount'],
               'unit_price'   => $product['unit_price'],
           ]);
       }

       $order = DB::transaction(function() use ($order, $items) {
           $order->save();
           $order->order_items()->saveMany($items);

           return $order;
       });

       return $this->response->array(['order_no', $order->no]);
    }

    /**
     * 删除订单
     *
     * @param $id
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        $order = $this->order->findOrFail($id);

        $order->delete();

        return response()->json(['info' => '删除成功']);
    }
}
