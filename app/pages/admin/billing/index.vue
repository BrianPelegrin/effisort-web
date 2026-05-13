<template>
    <div class="d-flex align-items-left align-items-md-center flex-column flex-md-row pt-2 pb-4">
        <div>
            <h3 class="fw-bold mb-3">Facturacion</h3>
            <h6 class="op-7 mb-2">Administra tus facturas</h6>
        </div>
        <div class="ms-md-auto py-2 py-md-0">
            <RouterLink to="/admin/billing/sale" class="btn btn-primary btn-round">Realizar Venta</RouterLink>
        </div>
    </div>
    <div class="card card-round">
        <div class="card-body p-0">
            <form>
                <fieldset class=" w-100 row align-items-center">
                    <div class="col-md-6 mb-2">
                        <div class="form-group">
                            <label class="fw-bold" for="search">Buscar por Codigo Factura, NCF y Cliente</label>
                            <div class="input-icon">
                                <input type="text" class="form-control" placeholder="Digitel codigo factura...">
                                <span class="input-icon-addon">
                                    <i class="fa fa-search"></i>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-2 mb-2">
                        <div class="form-group">
                            <label class="fw-bold">Fecha desde</label>
                            <input type="date" class="form-control"
                                placeholder="Digite el numero de factura para buscar" />
                        </div>
                    </div>
                    <div class="col-md-2 mb-2">
                        <div class="form-group">
                            <label class="fw-bold">Fecha hasta</label>
                            <input type="date" class="form-control"
                                placeholder="Digite el numero de factura para buscar" />
                        </div>
                    </div>
                    <div class="col-md-2 mb-2">
                        <button type="submit" class="btn btn-primary w-100">
                            <i class="fas fa-search"></i> Buscar
                        </button>
                    </div>
                </fieldset>
            </form>
        </div>

    </div>
    <div class="card card-round">
        <div class="card-header">
            <div class="card-title">Lista de Facturas</div>
        </div>
        <div class="card-body p-0">
            <div class="table-responsive">
                <!-- Projects table -->
                <table class="table align-items-center mb-0">
                    <thead class="thead-light">
                        <tr>
                            <th scope="col">Codigo Factura</th>
                            <th scope="col">Cliente</th>
                            <th scope="col" class="">Fecha</th>
                            <th scope="col" class="">Total</th>
                            <th scope="col" class="">Estado</th>
                            <th scope="col" class="">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="index in 10">
                            <th>
                                10231
                            </th>
                            <td>Cliente Consumidor Final</td>
                            <td class="">Mar 19, 2020, 2.45pm</td>
                            <td class="">$250.00</td>
                            <td class="">
                                <span class="badge badge-success">Completed</span>
                            </td>
                            <td class="">
                                <div class="btn-group btn-group-sm" role="group" aria-label="Basic example">
                                    <button type="button" class="btn btn-dark">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button type="button" class="btn btn-primary">
                                        <i class="fas fa-pen"></i>
                                    </button>
                                    <button type="button" class="btn btn-outline-danger">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">

</script>

<style scoped></style>