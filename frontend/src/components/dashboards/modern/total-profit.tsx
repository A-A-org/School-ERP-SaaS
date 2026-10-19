'use client';

import { useEffect, useState } from "react";

import { CardContent } from "@/components/ui/card";
import { DashboardCard } from "../../shared/dashboard-card";
import { ArrowRight, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";

import { apiFetch } from "@/api/client";


type Payment = {
  id: number;
  amount: string;
  payment_method: string;
  payment_date: string;
};


export default function TotalProfit() {

  const [feeCollection, setFeeCollection] =
    useState<number | null>(null);


  useEffect(() => {

    const loadPayments = async () => {

      try {

        const data =
          await apiFetch("/api/finance/payments/");


        const payments: Payment[] =
          Array.isArray(data)
            ? data
            : data.results || [];


        const now = new Date();

        const currentMonth =
          now.getMonth();

        const currentYear =
          now.getFullYear();


        const thisMonthPayments =
          payments.filter((payment) => {

            const paymentDate =
              new Date(
                `${payment.payment_date}T00:00:00`
              );

            return (
              paymentDate.getMonth() === currentMonth &&
              paymentDate.getFullYear() === currentYear
            );

          });


        const total =
          thisMonthPayments.reduce(
            (sum, payment) =>
              sum + Number(payment.amount),
            0
          );


        setFeeCollection(total);

      } catch (error) {

        console.error(
          "Failed to load fee collection:",
          error
        );

        setFeeCollection(0);

      }

    };


    loadPayments();

  }, []);


  return (
    <DashboardCard className="py-6">

      <CardContent className="flex justify-between flex-row px-6">

        <div className="flex flex-col items-start gap-4 w-full">

          <div className="flex items-center justify-between w-full">

            <div className="flex flex-col gap-1">

              <p className="text-sm font-normal text-foreground">
                Fee Collection
              </p>


              <h3 className="text-2xl font-semibold">

                {feeCollection === null
                  ? "..."
                  : `¥${feeCollection.toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}`
                }

              </h3>


              <p className="text-xs text-muted-foreground">
                This month
              </p>

            </div>


            <div className="border border-border p-2.5 w-fit rounded-md">

              <WalletCards size={16} />

            </div>

          </div>


          <Button
            variant="outline"
            className="flex gap-1.5 px-4 py-2 h-auto rounded-md cursor-pointer"
          >

            View Finance

            <ArrowRight
              width={18}
              height={18}
            />

          </Button>

        </div>

      </CardContent>

    </DashboardCard>
  );
}