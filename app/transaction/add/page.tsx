import CategorySelect from "@/app/CategorySelect";
import prisma from "@/lib/prisma";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/datepicker";
import { Label } from "@/components/ui/label";

type ContainerProps = {
    children: React.ReactNode;
    className?: string;
}

const FieldContainer = ({children, className}: ContainerProps) => {
    return (
        <div className={`mb-4 flex items-center gap-2 ${className}`}>
        {children}
        </div>
    )
}


const AddTransactionPage = async () => {
  const categories = await prisma.category.findMany();
  return (
    <div>
      <h1>Add Transaction</h1>
      <form>
        <FieldContainer>
          <Label className="w-24">Date</Label>
          <DatePicker />
        </FieldContainer>
        <FieldContainer>
          <Label className="w-24">Amount</Label>
          <Input type="number" name="value" className="w-50" required />
        </FieldContainer>
        <FieldContainer className="flex items-center">
          <Label className="w-24">Category</Label>
          <CategorySelect name="categoryId" className="w-50" categories={categories} />
        </FieldContainer>
        <FieldContainer>
          <Button>Cancel</Button>
          <Button>Submit</Button>
        </FieldContainer>
      </form>
    </div>
  );
};

export default AddTransactionPage;
