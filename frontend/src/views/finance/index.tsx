import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  Banknote,
  CircleDollarSign,
  CreditCard,
  Eye,
  Plus,
  Receipt,
  Search,
  Users,
  WalletCards,
} from "lucide-react";

import { apiFetch } from "@/api/client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


type FinanceTab =
  | "fees"
  | "payroll";


interface Payment {
  id: number;
  fee: number;
  amount: string;
  payment_method: string;
  payment_date: string;
  received_by_name: string | null;
}


interface Fee {
  id: number;
  student: number;
  student_name: string;

  month: string;
  year: number;

  total_amount: string;
  previous_balance: string;
  total_payable: string;
  paid_amount: string;
  remaining_amount: string;

  status:
    | "PAID"
    | "PARTIAL"
    | "PENDING";

  created_by_name: string | null;

  payments: Payment[];
}


interface Salary {
  id: number;

  employee: number;
  employee_name: string;

  month: string;
  year: number;

  basic_salary: string;
  allowance: string;
  deduction: string;

  net_salary: string;
  paid_amount: string;
  remaining_amount: string;

  status:
    | "PAID"
    | "PARTIAL"
    | "PENDING";

  created_by_name: string | null;
}


interface SalaryPayment {
  id: number;
  salary: number;
  amount: string;
  payment_method: string;
  payment_date: string;
  received_by_name: string | null;
}


interface Student {
  id: number;

  first_name: string;
  last_name: string;

  admission_number: string;

  school: number;
  school_name: string;
}


interface SchoolOption {
  id: number;
  school_name: string;
}


interface CurrentUser {
  role: string;
  school: number | null;
}


interface GenerateFeeForm {
  school: string;
  student: string;
  month: string;
  year: string;
  amount: string;
}


interface PaymentForm {
  amount: string;
  payment_method: string;
}


interface SalaryGenerationForm {
  school: string;
  month: string;
  year: string;
}


const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];


const today = new Date();

const currentMonth =
  MONTHS[today.getMonth()];

const currentYear =
  String(today.getFullYear());


function getList<T>(
  data: unknown
): T[] {

  if (Array.isArray(data)) {
    return data as T[];
  }


  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray(
      (
        data as {
          results?: unknown;
        }
      ).results
    )
  ) {

    return (
      data as {
        results: T[];
      }
    ).results;

  }


  return [];
}


function numberValue(
  value: string | number
) {

  const result =
    Number(value);

  return Number.isFinite(result)
    ? result
    : 0;
}


function money(
  value: string | number
) {

  return `¥${numberValue(
    value
  ).toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;

}


export default function FinancePage() {

  const [
    activeTab,
    setActiveTab,
  ] = useState<FinanceTab>(
    "fees"
  );


  const [
    fees,
    setFees,
  ] = useState<Fee[]>([]);


  const [
    ,
    setPayments,
  ] = useState<Payment[]>([]);


  const [
    salaries,
    setSalaries,
  ] = useState<Salary[]>([]);


  const [
    salaryPayments,
    setSalaryPayments,
  ] = useState<SalaryPayment[]>([]);


  const [
    students,
    setStudents,
  ] = useState<Student[]>([]);


  const [
    schools,
    setSchools,
  ] = useState<SchoolOption[]>([]);


  const [
    currentUser,
    setCurrentUser,
  ] = useState<CurrentUser | null>(
    null
  );


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    statusFilter,
    setStatusFilter,
  ] = useState("ALL");


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  const [
    success,
    setSuccess,
  ] = useState("");


  const [
    selectedFee,
    setSelectedFee,
  ] = useState<Fee | null>(
    null
  );


  const [
    selectedSalary,
    setSelectedSalary,
  ] = useState<Salary | null>(
    null
  );


  const [
    paymentFee,
    setPaymentFee,
  ] = useState<Fee | null>(
    null
  );


  const [
    paymentSalary,
    setPaymentSalary,
  ] = useState<Salary | null>(
    null
  );


  const [
    singleFeeOpen,
    setSingleFeeOpen,
  ] = useState(false);


  const [
    monthlyFeeOpen,
    setMonthlyFeeOpen,
  ] = useState(false);


  const [
    monthlySalaryOpen,
    setMonthlySalaryOpen,
  ] = useState(false);


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    feeForm,
    setFeeForm,
  ] = useState<GenerateFeeForm>({
    school: "",
    student: "",
    month: currentMonth,
    year: currentYear,
    amount: "",
  });


  const [
    paymentForm,
    setPaymentForm,
  ] = useState<PaymentForm>({
    amount: "",
    payment_method: "CASH",
  });


  const [
    salaryForm,
    setSalaryForm,
  ] = useState<SalaryGenerationForm>({
    school: "",
    month: currentMonth,
    year: currentYear,
  });


  const canManage =
    currentUser?.role === "OWNER" ||
    currentUser?.role === "ADMIN" ||
    currentUser?.role === "ACCOUNTANT";


  const isOwner =
    currentUser?.role === "OWNER";


  const loadFinance =
  async () => {

    const [
      feeData,
      paymentData,
      salaryData,
      salaryPaymentData,
    ] = await Promise.all([

      apiFetch(
        "/api/finance/fees/"
      ),

      apiFetch(
        "/api/finance/payments/"
      ),

      apiFetch(
        "/api/finance/salaries/"
      ),

      apiFetch(
        "/api/finance/salary-payments/"
      ),

    ]);


    setFees(
      getList<Fee>(
        feeData
      )
    );


    setPayments(
      getList<Payment>(
        paymentData
      )
    );


    setSalaries(
      getList<Salary>(
        salaryData
      )
    );


    setSalaryPayments(
      getList<SalaryPayment>(
        salaryPaymentData
      )
    );

  };


  useEffect(() => {

    const loadPage =
      async () => {

        try {

          setLoading(true);

          setError("");


          const [
            userData,
            studentData,
            schoolData,
          ] = await Promise.all([

            apiFetch(
              "/api/accounts/me/"
            ),

            apiFetch(
              "/api/students/"
            ),

            apiFetch(
              "/api/schools/"
            ),

          ]);


          const user =
            userData as CurrentUser;


          setCurrentUser(user);


          setStudents(
            getList<Student>(
              studentData
            )
          );


          setSchools(
            getList<SchoolOption>(
              schoolData
            )
          );


          const defaultSchool =
            user.role === "OWNER"
              ? ""
              : user.school
                ? String(
                    user.school
                  )
                : "";


          setFeeForm(
            (previous) => ({
              ...previous,
              school:
                defaultSchool,
            })
          );


          setSalaryForm(
            (previous) => ({
              ...previous,
              school:
                defaultSchool,
            })
          );


          await loadFinance();


        } catch (err) {

          console.error(err);

          setError(
            "Unable to load Finance. Finance access is limited to Owner, Admin and Accountant accounts."
          );

        } finally {

          setLoading(false);

        }

      };


    loadPage();

  }, []);


  const filteredFees =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();


      return fees.filter(
        (fee) => {

          const matchesSearch =
            !query ||

            fee.student_name
              .toLowerCase()
              .includes(query) ||

            fee.month
              .toLowerCase()
              .includes(query) ||

            String(
              fee.year
            ).includes(query);


          const matchesStatus =
            statusFilter === "ALL" ||
            fee.status ===
              statusFilter;


          return (
            matchesSearch &&
            matchesStatus
          );

        }
      );

    }, [
      fees,
      search,
      statusFilter,
    ]);


  const filteredSalaries =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();


      return salaries.filter(
        (salary) => {

          const matchesSearch =
            !query ||

            salary.employee_name
              .toLowerCase()
              .includes(query) ||

            salary.month
              .toLowerCase()
              .includes(query) ||

            String(
              salary.year
            ).includes(query);


          const matchesStatus =
            statusFilter === "ALL" ||
            salary.status ===
              statusFilter;


          return (
            matchesSearch &&
            matchesStatus
          );

        }
      );

    }, [
      salaries,
      search,
      statusFilter,
    ]);


  const totalBilled =
    fees.reduce(
      (sum, fee) =>
        sum +
        numberValue(
          fee.total_payable
        ),
      0
    );


  const totalCollected =
    fees.reduce(
      (sum, fee) =>
        sum +
        numberValue(
          fee.paid_amount
        ),
      0
    );


  const totalOutstanding =
    fees.reduce(
      (sum, fee) =>
        sum +
        numberValue(
          fee.remaining_amount
        ),
      0
    );


  const totalPayroll =
  salaries.reduce(
    (sum, salary) =>
      sum +
      numberValue(
        salary.net_salary
      ),
    0
  );


const totalSalaryPaid =
  salaries.reduce(
    (sum, salary) =>
      sum +
      numberValue(
        salary.paid_amount
      ),
    0
  );


const payrollOutstanding =
  salaries.reduce(
    (sum, salary) =>
      sum +
      numberValue(
        salary.remaining_amount
      ),
    0
  );


  const feeStudents =
    useMemo(() => {

      if (!feeForm.school) {
        return students;
      }


      return students.filter(
        (student) =>
          String(
            student.school
          ) ===
          feeForm.school
      );

    }, [
      students,
      feeForm.school,
    ]);


  const openSingleFee =
    () => {

      setError("");
      setSuccess("");

      setFeeForm(
        (previous) => ({
          ...previous,
          student: "",
          amount: "",
          month: currentMonth,
          year: currentYear,
        })
      );

      setSingleFeeOpen(true);

    };


  const openMonthlyFee =
    () => {

      setError("");
      setSuccess("");

      setFeeForm(
        (previous) => ({
          ...previous,
          amount: "",
          month: currentMonth,
          year: currentYear,
        })
      );

      setMonthlyFeeOpen(true);

    };


  const generateSingleFee =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {

      event.preventDefault();


      if (
        !feeForm.student ||
        !feeForm.month ||
        !feeForm.year ||
        !feeForm.amount
      ) {

        setError(
          "Complete all fee fields."
        );

        return;

      }


      try {

        setSaving(true);

        setError("");


        await apiFetch(
          "/api/finance/generate-fee/",
          {
            method: "POST",

            body:
              JSON.stringify({
                student:
                  Number(
                    feeForm.student
                  ),

                month:
                  feeForm.month,

                year:
                  Number(
                    feeForm.year
                  ),

                amount:
                  feeForm.amount,
              }),
          }
        );


        await loadFinance();

        setSingleFeeOpen(false);

        setSuccess(
          "Student fee generated successfully."
        );


      } catch (err) {

        console.error(err);

        setError(
          "Unable to generate the fee. A fee may already exist for this student and month."
        );

      } finally {

        setSaving(false);

      }

    };


  const generateMonthlyFees =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {

      event.preventDefault();


      if (
        !feeForm.month ||
        !feeForm.year ||
        !feeForm.amount ||
        (
          isOwner &&
          !feeForm.school
        )
      ) {

        setError(
          "Complete all monthly fee fields."
        );

        return;

      }


      try {

        setSaving(true);

        setError("");


        const payload: {
          month: string;
          year: number;
          amount: string;
          school?: number;
        } = {

          month:
            feeForm.month,

          year:
            Number(
              feeForm.year
            ),

          amount:
            feeForm.amount,

        };


        if (
          isOwner &&
          feeForm.school
        ) {

          payload.school =
            Number(
              feeForm.school
            );

        }


        await apiFetch(
          "/api/finance/generate-monthly-fees/",
          {
            method: "POST",

            body:
              JSON.stringify(
                payload
              ),
          }
        );


        await loadFinance();

        setMonthlyFeeOpen(false);

        setSuccess(
          "Monthly fees generated successfully."
        );


      } catch (err) {

        console.error(err);

        setError(
          "Unable to generate monthly fees."
        );

      } finally {

        setSaving(false);

      }

    };


  const recordFeePayment =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {

      event.preventDefault();


      if (
        !paymentFee ||
        !paymentForm.amount
      ) {
        return;
      }


      if (
        numberValue(
          paymentForm.amount
        ) >
        numberValue(
          paymentFee.remaining_amount
        )
      ) {

        setError(
          "Payment cannot exceed the remaining balance."
        );

        return;

      }


      try {

        setSaving(true);

        setError("");


        await apiFetch(
          "/api/finance/payments/",
          {
            method: "POST",

            body:
              JSON.stringify({
                fee:
                  paymentFee.id,

                amount:
                  paymentForm.amount,

                payment_method:
                  paymentForm.payment_method,
              }),
          }
        );


        await loadFinance();

        setPaymentFee(null);

        setPaymentForm({
          amount: "",
          payment_method:
            "CASH",
        });

        setSuccess(
          "Payment recorded successfully."
        );


      } catch (err) {

        console.error(err);

        setError(
          "Unable to record payment."
        );

      } finally {

        setSaving(false);

      }

    };


  const generateMonthlySalaries =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {

      event.preventDefault();


      if (
        !salaryForm.month ||
        !salaryForm.year ||
        (
          isOwner &&
          !salaryForm.school
        )
      ) {

        setError(
          "Complete all salary generation fields."
        );

        return;

      }


      try {

        setSaving(true);

        setError("");


        const payload: {
          month: string;
          year: number;
          school?: number;
        } = {

          month:
            salaryForm.month,

          year:
            Number(
              salaryForm.year
            ),

        };


        if (
          isOwner &&
          salaryForm.school
        ) {

          payload.school =
            Number(
              salaryForm.school
            );

        }


        await apiFetch(
          "/api/finance/generate-monthly-salaries/",
          {
            method: "POST",

            body:
              JSON.stringify(
                payload
              ),
          }
        );


        await loadFinance();

        setMonthlySalaryOpen(false);

        setSuccess(
          "Monthly salaries generated successfully."
        );


      } catch (err) {

        console.error(err);

        setError(
          "Unable to generate monthly salaries."
        );

      } finally {

        setSaving(false);

      }

    };


  const recordSalaryPayment =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {

      event.preventDefault();


      if (
        !paymentSalary ||
        !paymentForm.amount
      ) {
        return;
      }


      if (
        numberValue(
          paymentForm.amount
        ) >
        numberValue(
          paymentSalary.remaining_amount
        )
      ) {

        setError(
          "Salary payment cannot exceed the remaining balance."
        );

        return;

      }


      try {

        setSaving(true);

        setError("");


        await apiFetch(
          "/api/finance/salary-payments/",
          {
            method: "POST",

            body:
              JSON.stringify({
                salary:
                  paymentSalary.id,

                amount:
                  paymentForm.amount,

                payment_method:
                  paymentForm.payment_method,
              }),
          }
        );


        await loadFinance();

        setPaymentSalary(null);

        setPaymentForm({
          amount: "",
          payment_method:
            "CASH",
        });

        setSuccess(
          "Salary payment recorded successfully."
        );


      } catch (err) {

        console.error(err);

        setError(
          "Unable to record salary payment."
        );

      } finally {

        setSaving(false);

      }

    };


  return (

    <div className="space-y-6">


      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">


        <div>

          <h1 className="text-2xl font-semibold">
            Finance
          </h1>

          <p className="text-sm text-muted-foreground">
            Manage student fees, payments and staff payroll.
          </p>

        </div>


        {canManage && (

          <div className="flex flex-wrap gap-2">


            {activeTab ===
              "fees" ? (
              <>

                <Button
                  variant="outline"
                  onClick={
                    openSingleFee
                  }
                >

                  <Plus className="mr-2 h-4 w-4" />

                  Student Fee

                </Button>


                <Button
                  onClick={
                    openMonthlyFee
                  }
                >

                  <Receipt className="mr-2 h-4 w-4" />

                  Generate Monthly Fees

                </Button>

              </>

            ) : (

              <Button
                onClick={() =>
                  setMonthlySalaryOpen(
                    true
                  )
                }
              >

                <Banknote className="mr-2 h-4 w-4" />

                Generate Monthly Salaries

              </Button>

            )}


          </div>

        )}


      </div>


     <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

  {activeTab === "fees" ? (
    <>

      <StatCard
        title="Total Billed"
        value={money(totalBilled)}
        icon={
          <Receipt className="h-5 w-5" />
        }
      />

      <StatCard
        title="Collected"
        value={money(totalCollected)}
        icon={
          <CircleDollarSign className="h-5 w-5" />
        }
      />

      <StatCard
        title="Outstanding Fees"
        value={money(totalOutstanding)}
        icon={
          <WalletCards className="h-5 w-5" />
        }
      />

      <StatCard
        title="Fee Records"
        value={String(fees.length)}
        icon={
          <Users className="h-5 w-5" />
        }
      />

    </>
  ) : (
    <>

      <StatCard
        title="Total Payroll"
        value={money(totalPayroll)}
        icon={
          <Banknote className="h-5 w-5" />
        }
      />

      <StatCard
        title="Salary Paid"
        value={money(totalSalaryPaid)}
        icon={
          <CircleDollarSign className="h-5 w-5" />
        }
      />

      <StatCard
        title="Payroll Due"
        value={money(payrollOutstanding)}
        icon={
          <WalletCards className="h-5 w-5" />
        }
      />

      <StatCard
        title="Salary Records"
        value={String(salaries.length)}
        icon={
          <Users className="h-5 w-5" />
        }
      />

    </>
  )}

</div>


      {success && (

        <div className="rounded-lg border px-4 py-3">

          <p className="text-sm font-medium">
            {success}
          </p>

        </div>

      )}


      {error && (

        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3">

          <p className="text-sm text-destructive">
            {error}
          </p>

        </div>

      )}


      <div className="flex w-fit rounded-lg border p-1">


        <Button
          size="sm"
          variant={
            activeTab === "fees"
              ? "default"
              : "ghost"
          }
          onClick={() => {

            setActiveTab(
              "fees"
            );

            setSearch("");

            setStatusFilter(
              "ALL"
            );

          }}
        >
          Student Fees
        </Button>


        <Button
          size="sm"
          variant={
            activeTab === "payroll"
              ? "default"
              : "ghost"
          }
          onClick={() => {

            setActiveTab(
              "payroll"
            );

            setSearch("");

            setStatusFilter(
              "ALL"
            );

          }}
        >
          Payroll
        </Button>


      </div>


      <Card>


        <CardHeader className="space-y-4">


          <CardTitle>

            {activeTab ===
              "fees"
              ? "Student Fees"
              : "Employee Payroll"}

          </CardTitle>


          <div className="flex flex-col gap-3 md:flex-row">


            <div className="relative w-full max-w-md">

              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder={
                  activeTab ===
                    "fees"
                    ? "Search students..."
                    : "Search employees..."
                }
                style={{
                  paddingLeft:
                    "2.5rem",
                }}
              />

            </div>


            <Select
              value={
                statusFilter
              }
              onValueChange={(value) =>
                setStatusFilter(
                  value ?? "ALL"
                )
              }
            >

              <SelectTrigger className="w-full md:w-44">

                <span>

                  {statusFilter ===
                    "ALL"
                    ? "All Statuses"
                    : statusFilter}

                </span>

              </SelectTrigger>


              <SelectContent>

                <SelectItem value="ALL">
                  All Statuses
                </SelectItem>

                <SelectItem value="PAID">
                  Paid
                </SelectItem>

                <SelectItem value="PARTIAL">
                  Partial
                </SelectItem>

                <SelectItem value="PENDING">
                  Pending
                </SelectItem>

              </SelectContent>

            </Select>


          </div>


        </CardHeader>


        <CardContent>


          {loading ? (

            <div className="py-10 text-center text-sm text-muted-foreground">
              Loading finance...
            </div>

          ) : activeTab ===
            "fees" ? (

            <FeeTable
              fees={
                filteredFees
              }
              canManage={
                canManage
              }
              onView={
                setSelectedFee
              }
              onPay={(fee) => {

                setPaymentForm({
                  amount: "",
                  payment_method:
                    "CASH",
                });

                setPaymentFee(
                  fee
                );

              }}
            />

          ) : (

            <SalaryTable
              salaries={
                filteredSalaries
              }
              canManage={
                canManage
              }
              onView={
                setSelectedSalary
              }
              onPay={(salary) => {

                setPaymentForm({
                  amount: "",
                  payment_method:
                    "CASH",
                });

                setPaymentSalary(
                  salary
                );

              }}
            />

          )}


        </CardContent>


      </Card>


      {/* SINGLE STUDENT FEE */}

      <Dialog
        open={singleFeeOpen}
        onOpenChange={
          setSingleFeeOpen
        }
      >

        <DialogContent className="sm:max-w-lg">

          <DialogHeader>

            <DialogTitle>
              Generate Student Fee
            </DialogTitle>

            <DialogDescription>
              Create one monthly fee for a selected student.
            </DialogDescription>

          </DialogHeader>


          <form
            onSubmit={
              generateSingleFee
            }
            className="space-y-4"
          >


            {isOwner && (

              <Field label="School">

                <SchoolSelect
                  schools={
                    schools
                  }
                  value={
                    feeForm.school
                  }
                  onChange={(value) =>
                    setFeeForm(
                      (previous) => ({
                        ...previous,
                        school: value,
                        student: "",
                      })
                    )
                  }
                />

              </Field>

            )}


            <Field label="Student *">

              <Select
                value={
                  feeForm.student
                }
                onValueChange={(value) =>
                  setFeeForm(
                    (previous) => ({
                      ...previous,
                      student:
                        value ?? "",
                    })
                  )
                }
              >

                <SelectTrigger className="w-full">

                  <span>

                    {feeStudents.find(
                      (student) =>
                        String(
                          student.id
                        ) ===
                        feeForm.student
                    )
                      ? `${
                          feeStudents.find(
                            (student) =>
                              String(
                                student.id
                              ) ===
                              feeForm.student
                          )?.first_name
                        } ${
                          feeStudents.find(
                            (student) =>
                              String(
                                student.id
                              ) ===
                              feeForm.student
                          )?.last_name
                        }`
                      : "Select student"}

                  </span>

                </SelectTrigger>


                <SelectContent>

                  {feeStudents.map(
                    (student) => (

                      <SelectItem
                        key={
                          student.id
                        }
                        value={String(
                          student.id
                        )}
                      >

                        {student.first_name}
                        {" "}
                        {student.last_name}
                        {" • "}
                        {student.admission_number}

                      </SelectItem>

                    )
                  )}

                </SelectContent>

              </Select>

            </Field>


            <PeriodFields
              month={
                feeForm.month
              }
              year={
                feeForm.year
              }
              onMonth={(value) =>
                setFeeForm(
                  (previous) => ({
                    ...previous,
                    month: value,
                  })
                )
              }
              onYear={(value) =>
                setFeeForm(
                  (previous) => ({
                    ...previous,
                    year: value,
                  })
                )
              }
            />


            <Field label="Fee Amount *">

              <Input
                type="number"
                min="0"
                step="0.01"
                value={
                  feeForm.amount
                }
                onChange={(event) =>
                  setFeeForm(
                    (previous) => ({
                      ...previous,
                      amount:
                        event.target.value,
                    })
                  )
                }
                placeholder="0.00"
              />

            </Field>


            <DialogActions
              saving={saving}
              onCancel={() =>
                setSingleFeeOpen(
                  false
                )
              }
              submitLabel="Generate Fee"
            />


          </form>

        </DialogContent>

      </Dialog>


      {/* MONTHLY FEES */}

      <Dialog
        open={monthlyFeeOpen}
        onOpenChange={
          setMonthlyFeeOpen
        }
      >

        <DialogContent className="sm:max-w-lg">

          <DialogHeader>

            <DialogTitle>
              Generate Monthly Fees
            </DialogTitle>

            <DialogDescription>
              Generate fees for all students in the selected school.
            </DialogDescription>

          </DialogHeader>


          <form
            onSubmit={
              generateMonthlyFees
            }
            className="space-y-4"
          >


            {isOwner && (

              <Field label="School *">

                <SchoolSelect
                  schools={
                    schools
                  }
                  value={
                    feeForm.school
                  }
                  onChange={(value) =>
                    setFeeForm(
                      (previous) => ({
                        ...previous,
                        school: value,
                      })
                    )
                  }
                />

              </Field>

            )}


            <PeriodFields
              month={
                feeForm.month
              }
              year={
                feeForm.year
              }
              onMonth={(value) =>
                setFeeForm(
                  (previous) => ({
                    ...previous,
                    month: value,
                  })
                )
              }
              onYear={(value) =>
                setFeeForm(
                  (previous) => ({
                    ...previous,
                    year: value,
                  })
                )
              }
            />


            <Field label="Monthly Amount *">

              <Input
                type="number"
                min="0"
                step="0.01"
                value={
                  feeForm.amount
                }
                onChange={(event) =>
                  setFeeForm(
                    (previous) => ({
                      ...previous,
                      amount:
                        event.target.value,
                    })
                  )
                }
                placeholder="0.00"
              />

            </Field>


            <DialogActions
              saving={saving}
              onCancel={() =>
                setMonthlyFeeOpen(
                  false
                )
              }
              submitLabel="Generate Fees"
            />


          </form>

        </DialogContent>

      </Dialog>


      {/* FEE PAYMENT */}

      <Dialog
        open={paymentFee !== null}
        onOpenChange={(open) => {

          if (!open) {
            setPaymentFee(null);
          }

        }}
      >

        <DialogContent className="sm:max-w-lg">

          <DialogHeader>

            <DialogTitle>
              Record Student Payment
            </DialogTitle>

            <DialogDescription>

              {paymentFee
                ? `${paymentFee.student_name} • Remaining ${money(paymentFee.remaining_amount)}`
                : ""}

            </DialogDescription>

          </DialogHeader>


          <form
            onSubmit={
              recordFeePayment
            }
            className="space-y-4"
          >

            <PaymentFields
              form={
                paymentForm
              }
              setForm={
                setPaymentForm
              }
            />

            <DialogActions
              saving={saving}
              onCancel={() =>
                setPaymentFee(
                  null
                )
              }
              submitLabel="Record Payment"
            />

          </form>

        </DialogContent>

      </Dialog>


      {/* MONTHLY SALARY */}

      <Dialog
        open={monthlySalaryOpen}
        onOpenChange={
          setMonthlySalaryOpen
        }
      >

        <DialogContent className="sm:max-w-lg">

          <DialogHeader>

            <DialogTitle>
              Generate Monthly Salaries
            </DialogTitle>

            <DialogDescription>
              Generate payroll records from employee basic salaries.
            </DialogDescription>

          </DialogHeader>


          <form
            onSubmit={
              generateMonthlySalaries
            }
            className="space-y-4"
          >


            {isOwner && (

              <Field label="School *">

                <SchoolSelect
                  schools={
                    schools
                  }
                  value={
                    salaryForm.school
                  }
                  onChange={(value) =>
                    setSalaryForm(
                      (previous) => ({
                        ...previous,
                        school: value,
                      })
                    )
                  }
                />

              </Field>

            )}


            <PeriodFields
              month={
                salaryForm.month
              }
              year={
                salaryForm.year
              }
              onMonth={(value) =>
                setSalaryForm(
                  (previous) => ({
                    ...previous,
                    month: value,
                  })
                )
              }
              onYear={(value) =>
                setSalaryForm(
                  (previous) => ({
                    ...previous,
                    year: value,
                  })
                )
              }
            />


            <DialogActions
              saving={saving}
              onCancel={() =>
                setMonthlySalaryOpen(
                  false
                )
              }
              submitLabel="Generate Salaries"
            />


          </form>

        </DialogContent>

      </Dialog>


      {/* SALARY PAYMENT */}

      <Dialog
        open={
          paymentSalary !== null
        }
        onOpenChange={(open) => {

          if (!open) {
            setPaymentSalary(null);
          }

        }}
      >

        <DialogContent className="sm:max-w-lg">

          <DialogHeader>

            <DialogTitle>
              Record Salary Payment
            </DialogTitle>

            <DialogDescription>

              {paymentSalary
                ? `${paymentSalary.employee_name} • Remaining ${money(paymentSalary.remaining_amount)}`
                : ""}

            </DialogDescription>

          </DialogHeader>


          <form
            onSubmit={
              recordSalaryPayment
            }
            className="space-y-4"
          >

            <PaymentFields
              form={
                paymentForm
              }
              setForm={
                setPaymentForm
              }
            />

            <DialogActions
              saving={saving}
              onCancel={() =>
                setPaymentSalary(
                  null
                )
              }
              submitLabel="Record Salary Payment"
            />

          </form>

        </DialogContent>

      </Dialog>


      {/* FEE VIEW */}

      <Dialog
        open={selectedFee !== null}
        onOpenChange={(open) => {

          if (!open) {
            setSelectedFee(null);
          }

        }}
      >

        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">

          {selectedFee && (
            <>

              <DialogHeader>

                <DialogTitle>
                  {selectedFee.student_name}
                </DialogTitle>

                <DialogDescription>
                  Fee and payment history for {selectedFee.month} {selectedFee.year}.
                </DialogDescription>

              </DialogHeader>


              <div className="grid gap-4 py-4 sm:grid-cols-3">

                <Detail
                  label="Total Payable"
                  value={
                    money(
                      selectedFee.total_payable
                    )
                  }
                />

                <Detail
                  label="Paid"
                  value={
                    money(
                      selectedFee.paid_amount
                    )
                  }
                />

                <Detail
                  label="Remaining"
                  value={
                    money(
                      selectedFee.remaining_amount
                    )
                  }
                />

              </div>


              <h3 className="mb-3 font-medium">
                Payment History
              </h3>


              {selectedFee.payments.length ===
                0 ? (

                <p className="text-sm text-muted-foreground">
                  No payments recorded.
                </p>

              ) : (

                <div className="space-y-2">

                  {selectedFee.payments.map(
                    (payment) => (

                      <div
                        key={
                          payment.id
                        }
                        className="flex items-center justify-between rounded-lg border p-3"
                      >

                        <div>

                          <p className="font-medium">
                            {money(
                              payment.amount
                            )}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {payment.payment_date}
                            {" • "}
                            {payment.payment_method}
                          </p>

                        </div>


                        <CreditCard className="h-4 w-4 text-muted-foreground" />

                      </div>

                    )
                  )}

                </div>

              )}


            </>
          )}

        </DialogContent>

      </Dialog>


      {/* SALARY VIEW */}

      <Dialog
        open={
          selectedSalary !== null
        }
        onOpenChange={(open) => {

          if (!open) {
            setSelectedSalary(null);
          }

        }}
      >

        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">

          {selectedSalary && (
            <>

              <DialogHeader>

                <DialogTitle>
                  {selectedSalary.employee_name}
                </DialogTitle>

                <DialogDescription>
                  Payroll details for {selectedSalary.month} {selectedSalary.year}.
                </DialogDescription>

              </DialogHeader>


              <div className="grid gap-4 py-4 sm:grid-cols-3">

                <Detail
                  label="Basic Salary"
                  value={
                    money(
                      selectedSalary.basic_salary
                    )
                  }
                />

                <Detail
                  label="Allowance"
                  value={
                    money(
                      selectedSalary.allowance
                    )
                  }
                />

                <Detail
                  label="Deduction"
                  value={
                    money(
                      selectedSalary.deduction
                    )
                  }
                />

                <Detail
                  label="Net Salary"
                  value={
                    money(
                      selectedSalary.net_salary
                    )
                  }
                />

                <Detail
                  label="Paid"
                  value={
                    money(
                      selectedSalary.paid_amount
                    )
                  }
                />

                <Detail
                  label="Remaining"
                  value={
                    money(
                      selectedSalary.remaining_amount
                    )
                  }
                />

              </div>


              <h3 className="mb-3 font-medium">
                Payment History
              </h3>


              {salaryPayments.filter(
                (payment) =>
                  payment.salary ===
                  selectedSalary.id
              ).length === 0 ? (

                <p className="text-sm text-muted-foreground">
                  No salary payments recorded.
                </p>

              ) : (

                <div className="space-y-2">

                  {salaryPayments
                    .filter(
                      (payment) =>
                        payment.salary ===
                        selectedSalary.id
                    )
                    .map(
                      (payment) => (

                        <div
                          key={
                            payment.id
                          }
                          className="flex items-center justify-between rounded-lg border p-3"
                        >

                          <div>

                            <p className="font-medium">
                              {money(
                                payment.amount
                              )}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {payment.payment_date}
                              {" • "}
                              {payment.payment_method}
                            </p>

                          </div>


                          <Banknote className="h-4 w-4 text-muted-foreground" />

                        </div>

                      )
                    )}

                </div>

              )}


            </>
          )}

        </DialogContent>

      </Dialog>


    </div>

  );

}


function FeeTable({
  fees,
  canManage,
  onView,
  onPay,
}: {
  fees: Fee[];
  canManage: boolean;
  onView: (fee: Fee) => void;
  onPay: (fee: Fee) => void;
}) {

  if (fees.length === 0) {

    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        No fee records found.
      </div>
    );

  }


  return (

    <div className="overflow-x-auto">

      <Table>

        <TableHeader>

          <TableRow>

            <TableHead>
              Student
            </TableHead>

            <TableHead>
              Period
            </TableHead>

            <TableHead>
              Payable
            </TableHead>

            <TableHead>
              Paid
            </TableHead>

            <TableHead>
              Balance
            </TableHead>

            <TableHead>
              Status
            </TableHead>

            <TableHead className="text-right">
              Actions
            </TableHead>

          </TableRow>

        </TableHeader>


        <TableBody>

          {fees.map(
            (fee) => (

              <TableRow
                key={fee.id}
              >

                <TableCell className="font-medium">
                  {fee.student_name}
                </TableCell>

                <TableCell>
                  {fee.month} {fee.year}
                </TableCell>

                <TableCell>
                  {money(
                    fee.total_payable
                  )}
                </TableCell>

                <TableCell>
                  {money(
                    fee.paid_amount
                  )}
                </TableCell>

                <TableCell>
                  {money(
                    fee.remaining_amount
                  )}
                </TableCell>

                <TableCell>
                  <FinanceStatus
                    status={
                      fee.status
                    }
                  />
                </TableCell>

                <TableCell>

                  <div className="flex justify-end gap-2">

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onView(fee)
                      }
                    >
                      <Eye className="h-4 w-4" />
                      <span className="hidden lg:inline">
                        View
                      </span>
                    </Button>


                    {canManage &&
                      numberValue(
                        fee.remaining_amount
                      ) > 0 && (

                      <Button
                        size="sm"
                        onClick={() =>
                          onPay(fee)
                        }
                      >

                        <CreditCard className="h-4 w-4" />

                        <span className="hidden lg:inline">
                          Payment
                        </span>

                      </Button>

                    )}

                  </div>

                </TableCell>

              </TableRow>

            )
          )}

        </TableBody>

      </Table>

    </div>

  );

}


function SalaryTable({
  salaries,
  canManage,
  onView,
  onPay,
}: {
  salaries: Salary[];
  canManage: boolean;
  onView: (salary: Salary) => void;
  onPay: (salary: Salary) => void;
}) {

  if (
    salaries.length === 0
  ) {

    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        No payroll records found.
      </div>
    );

  }


  return (

    <div className="overflow-x-auto">

      <Table>

        <TableHeader>

          <TableRow>

            <TableHead>
              Employee
            </TableHead>

            <TableHead>
              Period
            </TableHead>

            <TableHead>
              Net Salary
            </TableHead>

            <TableHead>
              Paid
            </TableHead>

            <TableHead>
              Remaining
            </TableHead>

            <TableHead>
              Status
            </TableHead>

            <TableHead className="text-right">
              Actions
            </TableHead>

          </TableRow>

        </TableHeader>


        <TableBody>

          {salaries.map(
            (salary) => (

              <TableRow
                key={salary.id}
              >

                <TableCell className="font-medium">
                  {salary.employee_name}
                </TableCell>

                <TableCell>
                  {salary.month} {salary.year}
                </TableCell>

                <TableCell>
                  {money(
                    salary.net_salary
                  )}
                </TableCell>

                <TableCell>
                  {money(
                    salary.paid_amount
                  )}
                </TableCell>

                <TableCell>
                  {money(
                    salary.remaining_amount
                  )}
                </TableCell>

                <TableCell>
                  <FinanceStatus
                    status={
                      salary.status
                    }
                  />
                </TableCell>

                <TableCell>

                  <div className="flex justify-end gap-2">

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onView(
                          salary
                        )
                      }
                    >
                      <Eye className="h-4 w-4" />
                      <span className="hidden lg:inline">
                        View
                      </span>
                    </Button>


                    {canManage &&
                      numberValue(
                        salary.remaining_amount
                      ) > 0 && (

                      <Button
                        size="sm"
                        onClick={() =>
                          onPay(
                            salary
                          )
                        }
                      >

                        <Banknote className="h-4 w-4" />

                        <span className="hidden lg:inline">
                          Pay
                        </span>

                      </Button>

                    )}

                  </div>

                </TableCell>

              </TableRow>

            )
          )}

        </TableBody>

      </Table>

    </div>

  );

}


function FinanceStatus({
  status,
}: {
  status:
    | "PAID"
    | "PARTIAL"
    | "PENDING";
}) {

  if (status === "PAID") {

    return (
      <Badge>
        Paid
      </Badge>
    );

  }


  if (
    status === "PARTIAL"
  ) {

    return (
      <Badge variant="secondary">
        Partial
      </Badge>
    );

  }


  return (
    <Badge variant="outline">
      Pending
    </Badge>
  );

}


function PaymentFields({
  form,
  setForm,
}: {
  form: PaymentForm;
  setForm:
    React.Dispatch<
      React.SetStateAction<
        PaymentForm
      >
    >;
}) {

  return (
    <>

      <Field label="Amount *">

        <Input
          type="number"
          min="0.01"
          step="0.01"
          value={
            form.amount
          }
          onChange={(event) =>
            setForm(
              (previous) => ({
                ...previous,
                amount:
                  event.target.value,
              })
            )
          }
          placeholder="0.00"
        />

      </Field>


      <Field label="Payment Method">

        <Select
          value={
            form.payment_method
          }
          onValueChange={(value) =>
            setForm(
              (previous) => ({
                ...previous,
                payment_method:
                  value ??
                  "CASH",
              })
            )
          }
        >

          <SelectTrigger className="w-full">

            <span>
              {form.payment_method}
            </span>

          </SelectTrigger>


          <SelectContent>

            <SelectItem value="CASH">
              Cash
            </SelectItem>

            <SelectItem value="BANK">
              Bank Transfer
            </SelectItem>

            <SelectItem value="ONLINE">
              Online
            </SelectItem>

          </SelectContent>

        </Select>

      </Field>

    </>
  );

}


function PeriodFields({
  month,
  year,
  onMonth,
  onYear,
}: {
  month: string;
  year: string;
  onMonth: (value: string) => void;
  onYear: (value: string) => void;
}) {

  return (

    <div className="grid gap-4 sm:grid-cols-2">

      <Field label="Month *">

        <Select
          value={month}
          onValueChange={(value) =>
            onMonth(
              value ??
              currentMonth
            )
          }
        >

          <SelectTrigger className="w-full">
            <span>{month}</span>
          </SelectTrigger>

          <SelectContent>

            {MONTHS.map(
              (item) => (

                <SelectItem
                  key={item}
                  value={item}
                >
                  {item}
                </SelectItem>

              )
            )}

          </SelectContent>

        </Select>

      </Field>


      <Field label="Year *">

        <Input
          type="number"
          min="2000"
          max="2100"
          value={year}
          onChange={(event) =>
            onYear(
              event.target.value
            )
          }
        />

      </Field>

    </div>

  );

}


function SchoolSelect({
  schools,
  value,
  onChange,
}: {
  schools: SchoolOption[];
  value: string;
  onChange: (value: string) => void;
}) {

  const selected =
    schools.find(
      (school) =>
        String(
          school.id
        ) === value
    );


  return (

    <Select
      value={value}
      onValueChange={(next) =>
        onChange(
          next ?? ""
        )
      }
    >

      <SelectTrigger className="w-full">
        <span>
          {selected
            ? selected.school_name
            : "Select school"}
        </span>
      </SelectTrigger>

      <SelectContent>

        {schools.map(
          (school) => (

            <SelectItem
              key={
                school.id
              }
              value={String(
                school.id
              )}
            >
              {school.school_name}
            </SelectItem>

          )
        )}

      </SelectContent>

    </Select>

  );

}


function DialogActions({
  saving,
  onCancel,
  submitLabel,
}: {
  saving: boolean;
  onCancel: () => void;
  submitLabel: string;
}) {

  return (

    <DialogFooter>

      <Button
        type="button"
        variant="outline"
        disabled={saving}
        onClick={
          onCancel
        }
      >
        Cancel
      </Button>

      <Button
        type="submit"
        disabled={saving}
      >
        {saving
          ? "Saving..."
          : submitLabel}
      </Button>

    </DialogFooter>

  );

}


function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {

  return (

    <div className="space-y-2">

      <Label>
        {label}
      </Label>

      {children}

    </div>

  );

}


function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (

    <div className="space-y-1">

      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="text-sm font-medium">
        {value}
      </p>

    </div>

  );

}


function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: ReactNode;
}) {

  return (

    <Card>

      <CardContent className="flex items-center gap-8 p-5">

        <div>

          <p className="text-sm text-muted-foreground">
            {title}
          </p>

          <p className="mt-1 text-2xl font-semibold">
            {value}
          </p>

        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          {icon}
        </div>

      </CardContent>

    </Card>

  );

}