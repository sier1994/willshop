<template>
    <div>
        <ul id="cart-list">
            <li class="list-item" v-for="cart in carts">
                <input class="checker" type="checkbox" :value="cart" v-model="selectedCarts">
                <router-link :to="'/product/' + cart.product.id">
                    <img :src="cart.product.thumbnail" alt="" class="thumbnail">
                </router-link>
                <div class="right-part">
                    <router-link class="name" tag="div" :to="'/product/' + cart.product.id">{{ cart.product.name }}</router-link>
                    <span class="price">{{ cart.product.price }}</span>
                </div>
            </li>
        </ul>

        <footer>
            <label id="check-all" for="check-all">
                <input type="checkbox" v-model="selectAll" @click="checkAllClick"> 全选
            </label>
            <div class="summary">
                <div class="total-price">合计：{{ totalPrice }}</div>
                <div class="product-count">已选 {{ productAmount }} 件商品</div>
            </div>
            <button class="btn" :class="{ 'disabled': selectedCarts.length === 0 }" id="btn-checkout" @click="checkout">去结算</button>
        </footer>
    </div>
</template>

<script>
    export default {
        mounted () {
            this.getCarts();
        },

        data () {
            return {
                carts: [],
                selectedCarts: []
            }
        },

        computed: {
            selectAll () {
                return this.selectedCarts.length === this.carts.length;
            },

            totalPrice () {
                if (this.selectedCarts.length === 0) {
                    return 0;
                }

                // 选中的樟商品总价累加
                let price = 0;
                for(let index in this.selectedCarts) {
                     price += (this.selectedCarts[index].product.price * this.selectedCarts[index].amount);
                }

                return price;
            },

            productAmount () {
                if (this.selectedCarts.length === 0) {
                    return 0;
                }

                // 选中的订单中商品数累加
                let count = 0;
                for(let index in this.selectedCarts) {
                    count += this.selectedCarts[index].amount;
                }

                return count;
            }
        },

        methods: {
            // 获取购物车列表数据
            getCarts () {
                this.axios.get('cart').then(response => {
                    this.carts = response.data.carts;
                });
            },

            // 去结算
            checkout () {
                if (this.selectedCarts.length > 0) {
                    this.axios.post('checkout', { selectedCarts: this.selectedCarts }).then(response => {
                        this.$router.push('/checkout');
                    })
                }
            },

            // 全选和取消全选
            checkAllClick () {
                if (this.selectAll) {
                    this.selectedCarts = [];
                } else {
                    this.selectedCarts = this.carts;
                }
            }
        }
    }
</script>

<style scoped lang="scss">
    #cart-list {
        display: block;
        margin: 0;
        padding: 0;
        background-color: #fff;

        .list-item {
            display: block;
            overflow: hidden;
            padding: 10px;
            border-bottom: 1px solid #eee;

            .checker {
                display: inline-block;
                float: left;
                margin: 30px 15px 0 10px;
            }

            .thumbnail {
                display: block;
                float: left;
                width: 80px;
                height: 80px;
                border: 1px solid #eee;
            }

            .right-part {
                position: relative;
                display: block;
                overflow: hidden;
                height: 80px;
                float: left;
                padding: 0 10px;

                .name {
                    font-size: 15px;
                }

                .price {
                    position: absolute;
                    bottom: 0;
                    color: #f00;
                }
            }
        }
    }

    footer {
        display: block;
        position: fixed;
        bottom: 0;
        width: 100%;
        background-color: #fff;
        height: 50px;

        #check-all {
            float: left;
            margin: 11px 10px;
            font-size: 13px;
        }

        .summary {
            float: left;
            padding-left: 10px;
        }

        .total-price {
            color: #f00;
            font-size: 15px;
        }

        .product-count {
            font-size: 13px;
        }

        #btn-checkout {
            display: block;
            float: right;
            color: #fff;
            line-height: 50px;
            padding: 0 20px;
            background-color: #f00;
            border: none;

            &.disabled {
                background-color: #ccc;
            }
        }
    }
</style>
