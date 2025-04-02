import fs from "fs";
import csvParser from "csv-parser";
import prisma from "app/db.server"

const importCSV = async () => {
  const records: { shop:string, resourceType:string, resourceId:string, field:string, locale:string, market:string, content:string, translation:string }[] = [];

  fs.createReadStream("ztranslations.csv")
    .pipe(csvParser())
    .on("data", (row) => {
      records.push({
        shop: 'dept-merch-sandbox.myshopify.com', 
        resourceType: row.resourceType, 
        resourceId: row.resourceId,
        field: row.field,
        locale: row.locale,
        market: row.market, 
        content: row.content, 
        translation: row.translation
      });
    })
    .on("end", async () => {
      console.log(records);

      try {
        await prisma.translations.createMany({
          data: records,
          // skipDuplicates: true, // Prevents duplicate records
        });

        console.log("✅ CSV Import Completed!");
      } catch (error) {
        console.error("❌ Error importing CSV:", error);
      } finally {
        await prisma.$disconnect();
      }
    });
};

importCSV();
