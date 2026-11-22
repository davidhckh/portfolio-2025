// Files the developer "types" on the right monitor in the hero room (see
// three/objects/room/code-editor.ts). Each one is typed out, then its command runs in
// the terminal panel and prints the output lines. Keep lines under ~62 characters
// (the editor's width) and plain ASCII apart from the ✓ in outputs.

export type TerminalLine = { text: string; tone?: "ok" | "muted" | "info" };

export type CodeSnippet = {
  file: string;
  code: string;
  // Lines already in the file when it's opened (imports, class header), so the
  // screen never looks empty; typing starts after them.
  prefill: number;
  command: string;
  output: TerminalLine[];
};

export const codeSnippets: CodeSnippet[] = [
  {
    file: "OrderController.php",
    code: `<?php

namespace App\\Http\\Controllers;

use App\\Models\\Order;
use Illuminate\\Http\\Request;

class OrderController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $order = Order::create($data);

        return response()->json($order, 201);
    }
}`,
    prefill: 9,
    command: "php artisan test --filter=OrderTest",
    output: [
      { text: "PASS  Tests\\Feature\\OrderTest", tone: "ok" },
      { text: "✓ it stores a new order                  0.08s", tone: "muted" },
      { text: "✓ it rejects an invalid quantity         0.03s", tone: "muted" },
      { text: "Tests:  2 passed (6 assertions)", tone: "ok" },
    ],
  },
  {
    file: "create_invoices_table.php",
    code: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function ($table) {
            $table->id();
            $table->foreignId('order_id')->constrained();
            $table->decimal('total', 10, 2);
            $table->string('status')->default('pending');
            $table->timestamps();
        });
    }
};`,
    prefill: 7,
    command: "php artisan migrate",
    output: [
      { text: "INFO  Running migrations.", tone: "info" },
      { text: "create_invoices_table .............. 14ms DONE", tone: "muted" },
    ],
  },
  {
    file: "InvoiceService.php",
    code: `<?php

namespace App\\Services;

use App\\Models\\Order;
use App\\Models\\Invoice;

class InvoiceService
{
    public function generate(Order $order): Invoice
    {
        $total = $order->items->sum(
            fn ($item) => $item->price * $item->quantity
        );

        return $order->invoice()->create([
            'total' => $total,
            'status' => 'issued',
        ]);
    }
}`,
    prefill: 9,
    command: "php artisan test",
    output: [
      { text: "PASS  Tests\\Unit\\InvoiceServiceTest", tone: "ok" },
      { text: "✓ it sums the order items               0.02s", tone: "muted" },
      { text: "Tests:  14 passed (41 assertions)", tone: "ok" },
    ],
  },
];

// Typed on the laptop next to the avatar in the contact section ("Let's work
// together"). The laptop screen is wider and shorter: ~60 characters, 10 rows.
export const contactSnippets: CodeSnippet[] = [
  {
    file: "LetsWorkTogether.php",
    code: `<?php

$project = Project::idea('your next app');

$alejandro = Developer::hire('Alejandro Montalvan')
    ->stack(['PHP', 'Laravel', 'Vue', 'MySQL'])
    ->available(true);

return $alejandro->build($project);`,
    prefill: 2,
    command: "php artisan make:project --with=alejandro",
    output: [
      { text: "INFO  Project created.", tone: "info" },
      { text: "✓ Let's talk: alex1991usat@gmail.com", tone: "ok" },
    ],
  },
  {
    file: "ContactController.php",
    code: `<?php

class ContactController extends Controller
{
    public function send(Request $request)
    {
        Mail::to('alex1991usat@gmail.com')
            ->send(new Hello($request->message));

        return back()->with('status', 'sent');
    }
}`,
    prefill: 4,
    command: "php artisan queue:work --once",
    output: [
      { text: "App\\Mail\\Hello .................. 32ms DONE", tone: "muted" },
      { text: "✓ Message delivered. Talk soon!", tone: "ok" },
    ],
  },
];
