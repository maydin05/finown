import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

async function loadApi(client) {
  const context = vm.createContext({ console });
  const dependency = new vm.SyntheticModule(
    ["supabase"],
    function () {
      this.setExport("supabase", client);
    },
    { context },
  );
  const source = await readFile(
    new URL("../src/api/finown.js", import.meta.url),
    "utf8",
  );
  const module = new vm.SourceTextModule(source, { context });
  const statements=new vm.SourceTextModule(await readFile(new URL('../src/domain/cardStatements.js',import.meta.url),'utf8'),{context});
  await module.link(specifier=>{
    if(specifier.includes('cardStatements'))return statements;
    if(specifier.includes('supabase'))return dependency;
    throw new Error('Unexpected API dependency: '+specifier);
  });
  await module.evaluate();
  return module.namespace;
}
const auth = {
  getUser: async () => ({ data: { user: { id: "fixture-user" } } }),
};

test("tracker upsert uses composite user/key conflict target for true and false, never an id lookup", async () => {
  const calls = [];
  const api = await loadApi({
    auth,
    from(table) {
      assert.equal(table, "trackers");
      return {
        upsert(row, options) {
          calls.push({ row, options });
          return {
            select(columns) {
              assert.equal(columns, "key,value");
              return {
                single: async () => ({
                  data: { key: row.key, value: row.value },
                  error: null,
                }),
              };
            },
          };
        },
      };
    },
  });
  await api.upsertTracker("expense:7:2026:11", true);
  await api.upsertTracker("expense:7:2026:11", false);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].row.user_id, "fixture-user");
  assert.equal(calls[1].row.value, false);
  assert.equal(calls[0].options.onConflict, "user_id,key");
});
test("failed subscription history read rejects the load rather than returning an empty successful history", async () => {
  const api = await loadApi({
    auth,
    from(table) {
      return {
        select() {
          return {
            order: async () => ({
              data: [],
              error:
                table === "subscription_payments"
                  ? new Error("fixture failure")
                  : null,
            }),
          };
        },
      };
    },
  });
  await assert.rejects(api.getAllData, /fixture failure/);
});
test("getAllData reads data without any insert/upsert/migration operation", async () => {
  const api = await loadApi({
    auth,
    from() {
      return {
        select() {
          return { order: async () => ({ data: [], error: null }) };
        },
      };
    },
  });
  const result = await api.getAllData();
  assert.equal(result.subscriptionPayments.length, 0);
});

test("new loan uses one atomic RPC and never falls back to inserting an incomplete product", async () => {
  const calls = [];
  const api = await loadApi({
    auth,
    rpc: async (name, args) => {
      calls.push({ name, args });
      return {
        data: {
          product: { id: 1, first_payment_date: "2026-01-31" },
          payments: [{ id: 2, is_paid: false }],
        },
        error: null,
      };
    },
    from() {
      throw new Error("Separate insert forbidden");
    },
  });
  const result = await api.createLoanWithPayments({
    bankId: 1,
    name: "Fixture",
    installmentAmount: 100,
    totalInstallments: 3,
    firstPaymentDate: "2026-01-31",
    creationRequestId: "fixture-key",
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, "create_loan_with_payments");
  assert.equal(calls[0].args.p_request_id, "fixture-key");
  assert.equal(result.product.firstPaymentDate, "2026-01-31");
  assert.equal(result.payments[0].isPaid, false);
  assert.throws(() => api.createProduct({ type: "loan" }), /taksit planıyla/);
});
test("existing loan edits send no schedule, dates, paid flags or stale remaining value", async () => {
  const calls = [];
  const api = await loadApi({
    auth,
    rpc: async (name, args) => {
      calls.push({ name, args });
      return { data: { id: 1, name: args.p_name }, error: null };
    },
  });
  await api.updateProduct(1, {
    type: "loan",
    bankId: 1,
    name: "Updated",
    installmentAmount: 900,
    totalInstallments: 100,
    firstPaymentDate: "2027-01-01",
    remaining: 999,
  });
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    {
      name: "update_loan_details",
      args: { p_id: 1, p_bank_id: 1, p_name: "Updated" },
    },
  ]);
});

test('balance save uses only the owner snapshot RPC, accepts explicit zero and propagates errors', async () => {
  const calls=[];
  const api=await loadApi({auth,rpc:async(name,args)=>{calls.push({name,args});return {data:{amount:args.p_amount,user_id:'fixture-user',as_of_date:args.p_as_of_date,basis_fingerprint:args.p_basis_fingerprint},error:null};}});
  const saved=await api.saveAvailableBalance({amount:0,asOfDate:'2026-11-01',basisFingerprint:'a'.repeat(64)},'fixture-user');
  assert.equal(saved.amount,0);assert.equal(saved.userId,'fixture-user');assert.equal(calls.length,1);assert.equal(calls[0].name,'save_available_balance');assert.equal(calls[0].args.p_expected_user_id,'fixture-user');
  await assert.rejects(api.saveAvailableBalance({amount:100},'other-user'));assert.equal(calls.length,1);
  const failure=await loadApi({auth,rpc:async()=>({data:null,error:new Error('fixture failed')})});
  await assert.rejects(failure.saveAvailableBalance({amount:100},'fixture-user'),/fixture failed/);
});

test('balance reads stay scoped to the authenticated owner and never create a snapshot', async () => {
  const api=await loadApi({auth,from(table){return {select(){return {order:async()=>({data:table==='available_balances'?[{user_id:'other-user',amount:999},{user_id:'fixture-user',amount:0}]:[],error:null})};}};}});
  const result=await api.getAllData();assert.equal(result.userId,'fixture-user');assert.equal(result.availableBalance.amount,0);assert.equal(result.availableBalance.userId,'fixture-user');
});

test('monthly income receipt uses one owned RPC; failure never falls back to editing sources or trackers', async () => {
  const calls=[];
  const api=await loadApi({auth,rpc:async(name,args)=>{calls.push({name,args});return {data:{user_id:'fixture-user',income_id:1,actual_amount:115000},error:null};}});
  const receipt={incomeId:1,periodYear:2026,periodMonth:11,dueDate:'2026-11-05',expectedAmount:120000,actualAmount:115000,isReceived:true,note:'Deduction'};
  const result=await api.saveIncomeReceipt(receipt,'fixture-user');assert.equal(result.actualAmount,115000);assert.equal(calls.length,1);assert.equal(calls[0].name,'save_income_receipt');assert.equal(calls[0].args.p_expected_user_id,'fixture-user');assert.equal(calls[0].args.p_period_month,11);
  await assert.rejects(()=>api.saveIncomeReceipt(receipt,'another-owner'));assert.equal(calls.length,1);
  const failed=await loadApi({auth,rpc:async()=>({data:null,error:new Error('receipt save failed')})});await assert.rejects(()=>failed.saveIncomeReceipt(receipt,'fixture-user'),/receipt save failed/);
});


test('card start saves only product metadata; canonical month, invalid partial input and no payment writes',async()=>{
 const calls=[];
 const api=await loadApi({auth,from(table){
   assert.equal(table,'products');
   return {update(row){
     calls.push(row);
     const result={eq:()=>result,select:()=>result,single:async()=>({data:{id:18,...row},error:null})};
     return result;
   }};
 }});
 const saved=await api.updateProduct(18,{type:'card',cardType:'physical',name:'Fixture card',firstStatementMonth:'2026-11'});
 assert.equal(saved.firstStatementMonth,'2026-11-01');assert.equal(calls.length,1);assert.equal(calls[0].first_statement_month,'2026-11-01');
 await assert.rejects(api.updateProduct(18,{type:'card',firstStatementMonth:'2026-'}),/Invalid first statement/);assert.equal(calls.length,1);
 await api.updateProduct(18,{name:'Renamed'});assert.equal(Object.hasOwn(calls[1],'first_statement_month'),false);
 await api.updateProduct(18,{type:'card',firstStatementMonth:''});assert.equal(calls[2].first_statement_month,null);
});
