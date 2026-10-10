import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  createdAt: string;
}

export interface Notebook {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface SourceChunk {
  id: string;
  sourceId: string;
  notebookId: string;
  chunkIndex: number;
  sectionTitle: string;
  pageNumber?: number;
  slideNumber?: number;
  timestamp?: string;
  content: string;
  embedding?: number[];
}

export interface Source {
  id: string;
  notebookId: string;
  userId: string;
  title: string;
  type: 'pdf' | 'docx' | 'pptx' | 'txt' | 'csv' | 'image' | 'audio' | 'video' | 'youtube' | 'website' | 'text';
  originalName: string;
  mimeType?: string;
  size?: number;
  pageCount?: number;
  slideCount?: number;
  status: 'processing' | 'ready' | 'error';
  errorMessage?: string;
  extractedText: string;
  chunksCount: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Citation {
  sourceId?: string;
  sourceTitle: string;
  pageNumber?: number;
  slideNumber?: number;
  timestamp?: string;
  sectionTitle?: string;
  quote?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  notebookId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  notebookId: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export type ArtifactType =
  | 'summary'
  | 'audio_overview'
  | 'slide_deck'
  | 'video_overview'
  | 'mind_map'
  | 'report'
  | 'flashcards'
  | 'quiz'
  | 'infographic'
  | 'data_table'
  | 'study_guide'
  | 'questions'
  | 'definitions';

export interface Artifact {
  id: string;
  notebookId: string;
  userId: string;
  type: ArtifactType;
  title: string;
  content: any; // Structured payload depending on type
  settings?: Record<string, any>;
  sourceIds?: string[];
  createdAt: string;
  updatedAt: string;
}

interface DatabaseSchema {
  users: User[];
  notebooks: Notebook[];
  sources: Source[];
  sourceChunks: SourceChunk[];
  conversations: Conversation[];
  messages: ChatMessage[];
  artifacts: Artifact[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

class Database {
  private data: DatabaseSchema = {
    users: [],
    notebooks: [],
    sources: [],
    sourceChunks: [],
    conversations: [],
    messages: [],
    artifacts: []
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.seedDemoData();
        this.save();
      }
    } catch (e) {
      console.error('Error initializing database:', e);
      this.seedDemoData();
      this.save();
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving database:', e);
    }
  }

  private seedDemoData() {
    const demoUser: User = {
      id: 'demo-user-1',
      email: 'alex@gennote.ai',
      name: 'Alex Rivera',
      createdAt: new Date().toISOString()
    };

    const osNotebook: Notebook = {
      id: 'demo-nb-os',
      userId: demoUser.id,
      title: 'Operating Systems & Distributed Systems',
      description: 'Complete study material covering Process Management, CPU Scheduling, Virtual Memory & Paging.',
      category: 'Computer Science',
      createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
      updatedAt: new Date().toISOString()
    };

    const source1Text = `UNIT 1: PROCESS MANAGEMENT AND CPU SCHEDULING
A Process is defined as a program in execution. It includes the program code (text section), current activity represented by the program counter and processor registers, a process stack containing temporary data (function parameters, return addresses, local variables), a data section containing global variables, and a heap for dynamically allocated memory.

PROCESS STATES:
1. New: The process is being created.
2. Running: Instructions are being executed by the CPU.
3. Waiting (or Blocked): The process is waiting for some event to occur (such as an I/O completion or reception of a signal).
4. Ready: The process is waiting to be assigned to a processor.
5. Terminated: The process has finished execution.

PROCESS CONTROL BLOCK (PCB):
Each process is represented in the operating system by a Process Control Block (PCB), also called a task control block. It contains:
- Process State: New, ready, running, waiting, etc.
- Program Counter: Indicates the address of the next instruction to be executed.
- CPU Registers: Accumulators, index registers, stack pointers, general-purpose registers.
- CPU-Scheduling Information: Process priority, pointers to scheduling queues.
- Memory-Management Information: Value of base and limit registers, page tables or segment tables.
- Accounting Information: Amount of CPU used, time limits, account numbers.
- I/O Status Information: List of I/O devices allocated to the process, list of open files.

CONTEXT SWITCH:
Switching the CPU to another process requires performing a state save of the current process and a state restore of a different process. This task is known as a Context Switch. When a context switch occurs, the kernel saves the context of the old process in its PCB and loads the saved context of the new process scheduled to run. Context-switch time is pure overhead, because the system does no useful work while switching. Its speed varies from machine to machine, depending on memory speed, the number of registers that must be copied, and the existence of special instructions.

CPU SCHEDULING ALGORITHMS:
1. First-Come, First-Served (FCFS): The process that requests the CPU first is allocated the CPU first. Non-preemptive. Can lead to the Convoy Effect, where short processes wait behind a long CPU-burst process.
2. Shortest-Job-First (SJF): Associates with each process the length of its next CPU burst. Optimal for minimizing average turnaround and waiting time, but difficult to know future burst lengths.
3. Round Robin (RR): Designed especially for time-sharing systems. A small unit of time, called a time quantum or time slice (usually 10 to 100 milliseconds), is defined. The ready queue is treated as a circular FIFO queue. Preemptive.
4. Priority Scheduling: A priority is associated with each process, and the CPU is allocated to the process with the highest priority. Major issue: Starvation or indefinite blocking. Solution: Aging (gradually increasing the priority of processes that wait in the system for a long time).`;

    const source2Text = `UNIT 2: MEMORY MANAGEMENT AND VIRTUAL MEMORY
MEMORY HIERARCHY:
The memory unit is an array of words or bytes, each with its own address. The CPU fetches instructions from memory according to the value of the program counter. Registers built into the CPU are accessible within one CPU clock cycle. Main memory access takes many CPU clock cycles, often stalling the processor. Caches are introduced between the CPU and main memory to accelerate access.

LOGICAL VERSUS PHYSICAL ADDRESS SPACE:
An address generated by the CPU is commonly referred to as a Logical Address (or Virtual Address). An address seen by the memory unit—that is, the one loaded into the memory address register of the memory—is commonly referred to as a Physical Address.
The run-time mapping from virtual to physical addresses is done by a hardware device called the Memory Management Unit (MMU).

PAGING:
Paging is a memory-management scheme that permits the physical address space of a process to be noncontiguous. Physical memory is broken into fixed-sized blocks called Frames. Logical memory is broken into blocks of the same size called Pages.
When a process is to be executed, its pages are loaded into any available memory frames from backing store.
Every address generated by the CPU is divided into two parts:
1. Page Number (p): Used as an index into a page table.
2. Page Offset (d): Combined with the base address to define the physical memory address.

PAGE TABLE AND TLB:
The page table contains the base address of each page in physical memory. Because memory access time doubles if the page table is stored in main memory (one access to get the frame number from the page table, another access to get the actual data), modern hardware uses a Translation Lookaside Buffer (TLB)—a high-speed associative hardware cache.
If the page number is found in the TLB (a TLB Hit), the frame number is immediately available. If not (a TLB Miss), a memory reference to the page table must be made.

VIRTUAL MEMORY AND DEMAND PAGING:
Virtual Memory is a technique that allows the execution of processes that are not completely in memory. One major advantage is that programs can be larger than physical memory.
Demand Paging: Rather than loading the entire program into physical memory at execution start, pages are loaded only on demand (when requested during execution).
Page Fault: If the process attempts to access a page that is marked invalid (not in physical memory), a page-fault trap occurs. The operating system handles the trap:
1. Check internal table to decide if reference is valid or invalid.
2. If invalid, terminate process. If valid, find a free frame.
3. Schedule disk operation to read desired page into allocated frame.
4. Modify internal table and page table to indicate page is now in memory.
5. Restart the instruction that was interrupted by the page-fault trap.`;

    const source1: Source = {
      id: 'demo-src-1',
      notebookId: osNotebook.id,
      userId: demoUser.id,
      title: 'OS Unit 1 — Process Management & CPU Scheduling.pdf',
      type: 'pdf',
      originalName: 'OS_Unit_1_Process_Management.pdf',
      mimeType: 'application/pdf',
      size: 245000,
      pageCount: 14,
      status: 'ready',
      extractedText: source1Text,
      chunksCount: 4,
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
    };

    const source2: Source = {
      id: 'demo-src-2',
      notebookId: osNotebook.id,
      userId: demoUser.id,
      title: 'OS Unit 2 — Paging, Virtual Memory & TLB.pdf',
      type: 'pdf',
      originalName: 'OS_Unit_2_Memory_Management.pdf',
      mimeType: 'application/pdf',
      size: 310000,
      pageCount: 18,
      status: 'ready',
      extractedText: source2Text,
      chunksCount: 4,
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
    };

    const chunks: SourceChunk[] = [
      {
        id: 'chunk-1-1',
        sourceId: source1.id,
        notebookId: osNotebook.id,
        chunkIndex: 0,
        sectionTitle: 'Process Definition and States',
        pageNumber: 2,
        content: 'A Process is defined as a program in execution. It includes the text section, program counter, process stack, data section, and heap. States: New, Running, Waiting, Ready, Terminated.'
      },
      {
        id: 'chunk-1-2',
        sourceId: source1.id,
        notebookId: osNotebook.id,
        chunkIndex: 1,
        sectionTitle: 'Process Control Block (PCB)',
        pageNumber: 4,
        content: 'PCB contains Process State, Program Counter, CPU registers, CPU scheduling info, Memory-management info, Accounting info, and I/O status info.'
      },
      {
        id: 'chunk-1-3',
        sourceId: source1.id,
        notebookId: osNotebook.id,
        chunkIndex: 2,
        sectionTitle: 'Context Switch',
        pageNumber: 6,
        content: 'Switching CPU to another process requires state save of current process and state restore of another process. Context-switch time is pure computational overhead.'
      },
      {
        id: 'chunk-1-4',
        sourceId: source1.id,
        notebookId: osNotebook.id,
        chunkIndex: 3,
        sectionTitle: 'CPU Scheduling Algorithms',
        pageNumber: 9,
        content: 'FCFS (First-Come, First-Served suffers from convoy effect), SJF (Shortest-Job-First, optimal average waiting time), Round Robin (time quantum slices), Priority Scheduling (solves starvation via aging).'
      },
      {
        id: 'chunk-2-1',
        sourceId: source2.id,
        notebookId: osNotebook.id,
        chunkIndex: 0,
        sectionTitle: 'Logical vs Physical Address Space',
        pageNumber: 3,
        content: 'CPU generates Logical (Virtual) Address. Physical Address is seen by memory unit. Memory Management Unit (MMU) performs hardware run-time mapping.'
      },
      {
        id: 'chunk-2-2',
        sourceId: source2.id,
        notebookId: osNotebook.id,
        chunkIndex: 1,
        sectionTitle: 'Paging Architecture',
        pageNumber: 7,
        content: 'Paging permits noncontiguous physical allocation. Physical memory divided into fixed-size Frames; logical memory divided into equal Pages. Address has page number (p) and offset (d).'
      },
      {
        id: 'chunk-2-3',
        sourceId: source2.id,
        notebookId: osNotebook.id,
        chunkIndex: 2,
        sectionTitle: 'Translation Lookaside Buffer (TLB)',
        pageNumber: 11,
        content: 'TLB is a fast associative cache for page table entries. TLB Hit retrieves frame immediately; TLB Miss causes main memory lookup.'
      },
      {
        id: 'chunk-2-4',
        sourceId: source2.id,
        notebookId: osNotebook.id,
        chunkIndex: 3,
        sectionTitle: 'Demand Paging and Page Faults',
        pageNumber: 15,
        content: 'Virtual memory allows executing partially loaded programs. Demand Paging loads pages when needed. A Page Fault occurs when accessing non-resident pages, triggering OS disk fetch.'
      }
    ];

    const conversation: Conversation = {
      id: 'demo-conv-1',
      notebookId: osNotebook.id,
      userId: demoUser.id,
      title: 'Operating Systems Study Q&A',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      updatedAt: new Date().toISOString()
    };

    const initialMessages: ChatMessage[] = [
      {
        id: 'msg-1',
        conversationId: conversation.id,
        notebookId: osNotebook.id,
        role: 'user',
        content: 'Explain paging and how it relates to physical frames.',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: 'msg-2',
        conversationId: conversation.id,
        notebookId: osNotebook.id,
        role: 'assistant',
        content: `**Paging** is a memory-management scheme that permits the physical address space of a process to be noncontiguous.

### Key Architectural Concepts:
1. **Frames**: Physical memory is broken down into fixed-sized blocks called **Frames**.
2. **Pages**: Logical memory (the address space seen by the process) is broken down into blocks of the exact same size called **Pages**.
3. **Address Breakdown**: Every address generated by the CPU consists of a **Page Number ($p$)** and a **Page Offset ($d$)**. The page number is used as an index into the page table to find the corresponding physical frame base address.

Because pages can map to any free frame anywhere in physical RAM, paging completely eliminates external fragmentation.

[Source: OS Unit 2 — Paging, Virtual Memory & TLB.pdf — Page 7]`,
        citations: [
          {
            sourceId: source2.id,
            sourceTitle: source2.title,
            pageNumber: 7,
            sectionTitle: 'Paging Architecture',
            quote: 'Physical memory is broken into fixed-sized blocks called Frames. Logical memory is broken into blocks of the same size called Pages.'
          }
        ],
        createdAt: new Date(Date.now() - 3600000 * 2 + 5000).toISOString()
      }
    ];

    const demoArtifacts: Artifact[] = [
      {
        id: 'art-summary-1',
        notebookId: osNotebook.id,
        userId: demoUser.id,
        type: 'summary',
        title: 'Core Concepts Summary: Process & Memory Management',
        content: {
          mode: 'detailed',
          overview: 'Operating Systems manage CPU execution through processes, context switching, and scheduling policies, while managing physical RAM through paging, TLBs, and demand paging.',
          keyPoints: [
            'A process is a program in execution containing code, stack, data section, heap, and PCB.',
            'Context switching swaps active process states but represents computational overhead.',
            'CPU Scheduling strategies include FCFS, SJF (optimal waiting time), Round Robin, and Priority.',
            'Paging splits memory into equal Pages and Frames, mapped by the MMU with TLB hardware caching.',
            'Demand paging brings pages into physical RAM only when referenced, handling page faults via disk I/O.'
          ],
          sections: [
            {
              title: 'Process Management & Scheduling',
              text: 'Processes transition across New, Ready, Running, Waiting, and Terminated states. The OS tracks each process via the Process Control Block (PCB). When switching processes, the kernel performs a context switch.'
            },
            {
              title: 'Virtual Memory & Demand Paging',
              text: 'Demand paging allows programs larger than physical memory to execute seamlessly. When an invalid page is referenced, a page fault trap triggers the OS kernel to load the missing page from secondary storage.'
            }
          ]
        },
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'art-audio-1',
        notebookId: osNotebook.id,
        userId: demoUser.id,
        type: 'audio_overview',
        title: 'Deep Dive Dialogue: Process Scheduling & Virtual Memory',
        content: {
          duration: '4:15',
          speakers: [
            { id: 'host', name: 'Dr. Sarah (Host)', voice: 'Kore' },
            { id: 'guest', name: 'Marcus (Discussion Partner)', voice: 'Puck' }
          ],
          dialogue: [
            {
              speaker: 'host',
              text: "Welcome back to GenNote Audio Overview! Today we are dissecting one of the most foundational topics in computer systems: how operating systems juggle running programs and physical memory."
            },
            {
              speaker: 'guest',
              text: "Right! And what's fascinating is the clever illusion the OS creates. Every program acts like it owns all the memory in the universe, but under the hood, it's fragmented across physical frames."
            },
            {
              speaker: 'host',
              text: "Exactly. That's Paging. Logical memory is sliced into pages, and physical RAM is sliced into frames of the exact same size. The MMU and page tables map them in hardware."
            },
            {
              speaker: 'guest',
              text: "And when the CPU looks for an address, it uses the Translation Lookaside Buffer, or TLB, as a high-speed cache so we don't have to hit RAM twice for every single pointer lookup!"
            },
            {
              speaker: 'host',
              text: "Spot on. And when a process isn't in memory yet? That's a Page Fault, and Demand Paging quietly brings it in from disk. Let's explore how that ties directly into CPU scheduling."
            }
          ]
        },
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'art-flashcards-1',
        notebookId: osNotebook.id,
        userId: demoUser.id,
        type: 'flashcards',
        title: 'Key Terms & Exam Flashcards (10 Cards)',
        content: {
          cards: [
            {
              id: 'fc-1',
              front: 'What is a Process in an Operating System?',
              back: 'A process is a program in execution, consisting of program code, program counter, registers, stack, data section, and heap.',
              tag: 'Process Management',
              difficulty: 'easy'
            },
            {
              id: 'fc-2',
              front: 'What is stored inside a Process Control Block (PCB)?',
              back: 'Process State, Program Counter, CPU registers, scheduling info (priority, queue pointers), memory management info, accounting info, and allocated I/O device list.',
              tag: 'Process Management',
              difficulty: 'medium'
            },
            {
              id: 'fc-3',
              front: 'Why is Context Switch time considered pure overhead?',
              back: 'Because the CPU does not perform any useful user work while saving the state of the old process and loading the state of the new process.',
              tag: 'Scheduling',
              difficulty: 'medium'
            },
            {
              id: 'fc-4',
              front: 'What is the Convoy Effect in FCFS scheduling?',
              back: 'When multiple short processes are stuck waiting behind one long CPU-burst process in the ready queue, driving down overall CPU and device utilization.',
              tag: 'Scheduling',
              difficulty: 'hard'
            },
            {
              id: 'fc-5',
              front: 'What is the difference between a Page and a Frame in Paging?',
              back: 'A Page is a fixed-size contiguous block of logical (virtual) memory. A Frame is a fixed-size contiguous block of physical RAM of the identical size.',
              tag: 'Memory',
              difficulty: 'easy'
            },
            {
              id: 'fc-6',
              front: 'What is a Translation Lookaside Buffer (TLB)?',
              back: 'A fast hardware associative cache that stores recently accessed virtual-to-physical page table translations to speed up memory access.',
              tag: 'Memory',
              difficulty: 'medium'
            },
            {
              id: 'fc-7',
              front: 'What sequence occurs during a Page Fault?',
              back: '1. CPU attempts access; 2. Trap to OS; 3. Validate reference; 4. Find free frame; 5. Disk I/O to read page; 6. Update page table; 7. Restart instruction.',
              tag: 'Virtual Memory',
              difficulty: 'hard'
            },
            {
              id: 'fc-8',
              front: 'How does Aging solve starvation in Priority Scheduling?',
              back: 'By gradually increasing the priority of processes that have been waiting in the ready queue for a long duration, guaranteeing eventual execution.',
              tag: 'Scheduling',
              difficulty: 'medium'
            }
          ]
        },
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'art-quiz-1',
        notebookId: osNotebook.id,
        userId: demoUser.id,
        type: 'quiz',
        title: 'Mastery Quiz: Scheduling & Memory Architecture',
        content: {
          questions: [
            {
              id: 'q1',
              type: 'mcq',
              question: 'Which CPU scheduling algorithm gives the minimum average waiting time for a given set of processes?',
              options: [
                'First-Come, First-Served (FCFS)',
                'Shortest-Job-First (SJF)',
                'Round Robin with large time quantum',
                'Priority Scheduling without aging'
              ],
              correctAnswer: 1,
              explanation: 'Shortest-Job-First (SJF) is mathematically optimal because scheduling the shortest job first minimizes the waiting times of all subsequent processes.',
              topic: 'CPU Scheduling'
            },
            {
              id: 'q2',
              type: 'mcq',
              question: 'In paging, physical memory is partitioned into equal chunks called:',
              options: ['Segments', 'Pages', 'Frames', 'Blocks'],
              correctAnswer: 2,
              explanation: 'Physical memory is divided into fixed-size chunks called Frames. Logical memory is divided into chunks called Pages.',
              topic: 'Memory Management'
            },
            {
              id: 'q3',
              type: 'true_false',
              question: 'Context switch time does useful computational work for the running process.',
              options: ['True', 'False'],
              correctAnswer: 1,
              explanation: 'False. Context-switch time is pure system overhead because the processor is only saving and restoring registers and PCBs rather than executing program instructions.',
              topic: 'Process Management'
            },
            {
              id: 'q4',
              type: 'mcq',
              question: 'What hardware component performs run-time translation between virtual addresses and physical addresses?',
              options: ['ALU', 'MMU (Memory Management Unit)', 'DMA Controller', 'Interrupt Controller'],
              correctAnswer: 1,
              explanation: 'The MMU (Memory Management Unit) is the hardware device that maps logical addresses generated by the CPU to physical memory addresses.',
              topic: 'Memory Architecture'
            },
            {
              id: 'q5',
              type: 'mcq',
              question: 'What technique prevents starvation in Priority Scheduling systems?',
              options: ['Paging', 'Demand Paging', 'Aging', 'Compaction'],
              correctAnswer: 2,
              explanation: 'Aging gradually increases the priority of processes that wait in the system for an extended period, ensuring low-priority jobs eventually run.',
              topic: 'CPU Scheduling'
            }
          ]
        },
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'art-mindmap-1',
        notebookId: osNotebook.id,
        userId: demoUser.id,
        type: 'mind_map',
        title: 'Operating Systems Knowledge Graph',
        content: {
          root: {
            id: 'node-root',
            label: 'Operating Systems',
            children: [
              {
                id: 'node-proc',
                label: 'Process Management',
                children: [
                  {
                    id: 'node-states',
                    label: 'States (New, Ready, Running, Waiting, Terminated)',
                    children: []
                  },
                  {
                    id: 'node-pcb',
                    label: 'PCB (Registers, Program Counter, State, Memory info)',
                    children: []
                  },
                  {
                    id: 'node-ctx',
                    label: 'Context Switch (Overhead, State Save/Restore)',
                    children: []
                  }
                ]
              },
              {
                id: 'node-sched',
                label: 'CPU Scheduling',
                children: [
                  { id: 'node-fcfs', label: 'FCFS (Convoy effect)', children: [] },
                  { id: 'node-sjf', label: 'SJF (Optimal waiting time)', children: [] },
                  { id: 'node-rr', label: 'Round Robin (Time quantum)', children: [] },
                  { id: 'node-prio', label: 'Priority (Starvation & Aging)', children: [] }
                ]
              },
              {
                id: 'node-mem',
                label: 'Memory Management',
                children: [
                  {
                    id: 'node-addr',
                    label: 'Address Spaces (Logical vs Physical, MMU)',
                    children: []
                  },
                  {
                    id: 'node-paging',
                    label: 'Paging (Pages, Frames, Page Table)',
                    children: []
                  },
                  {
                    id: 'node-tlb',
                    label: 'TLB Cache (Hits vs Misses)',
                    children: []
                  }
                ]
              },
              {
                id: 'node-vm',
                label: 'Virtual Memory',
                children: [
                  {
                    id: 'node-dp',
                    label: 'Demand Paging (Lazy loading)',
                    children: []
                  },
                  {
                    id: 'node-pf',
                    label: 'Page Faults (Traps, Disk I/O, Restart)',
                    children: []
                  }
                ]
              }
            ]
          }
        },
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'art-slides-1',
        notebookId: osNotebook.id,
        userId: demoUser.id,
        type: 'slide_deck',
        title: 'Presentation: Operating Systems Fundamentals',
        content: {
          style: 'professional',
          slides: [
            {
              id: 's1',
              title: 'Operating Systems: Architecture & Mechanics',
              subtitle: 'Process Lifecycle, CPU Scheduling, and Memory Virtualization',
              bullets: [
                'How modern operating systems coordinate concurrent processes',
                'Minimizing turnaround time and scheduling latency',
                'Virtual address mapping through hardware-assisted paging'
              ],
              visualSuggestion: 'Diagram of CPU connected to MMU and RAM with multiple process queues',
              citation: 'OS Unit 1 & 2'
            },
            {
              id: 's2',
              title: 'Process Anatomy & PCB',
              subtitle: 'From Code to Active Execution',
              bullets: [
                'Memory layout: Text segment, Stack, Data segment, Heap',
                'Process Control Block (PCB) acts as the OS ledger for execution state',
                'Context switching saves hardware registers to maintain isolation',
                'Overhead is incurred on every scheduling transition'
              ],
              visualSuggestion: 'Memory diagram showing stack growing down, heap growing up, and PCB block',
              citation: 'OS Unit 1 — Page 4'
            },
            {
              id: 's3',
              title: 'CPU Scheduling Algorithms Compared',
              subtitle: 'Finding Optimal Throughput and Fairness',
              bullets: [
                'FCFS: Simple FIFO queue, but vulnerable to convoy latency delays',
                'SJF: Mathematically optimal average wait time, requires burst estimates',
                'Round Robin: Time slices ensure responsive interactive computing',
                'Priority: High-priority first; aging prevents thread starvation'
              ],
              visualSuggestion: 'Bar chart comparing waiting times across FCFS, SJF, and Round Robin',
              citation: 'OS Unit 1 — Page 9'
            },
            {
              id: 's4',
              title: 'Paging & Address Translation',
              subtitle: 'Eliminating External Fragmentation',
              bullets: [
                'Logical addresses are decomposed into page number (p) and offset (d)',
                'Physical memory is segmented into fixed-size frames',
                'MMU and Page Table map pages to arbitrary physical frames',
                'Hardware TLB provides single-cycle address translation caching'
              ],
              visualSuggestion: 'Flowchart tracing CPU logical address through TLB to physical frame',
              citation: 'OS Unit 2 — Page 7'
            },
            {
              id: 's5',
              title: 'Virtual Memory & Demand Paging',
              subtitle: 'Executing Programs Beyond Physical RAM Limits',
              bullets: [
                'Pages are loaded on-demand only when executed',
                'Page fault traps prompt OS kernel to schedule disk block reads',
                'Suspended instruction restarts transparently after frame is loaded',
                'Enables massive multi-tasking and efficient memory utilization'
              ],
              visualSuggestion: 'Cycle diagram showing reference -> trap -> page in -> table update -> restart',
              citation: 'OS Unit 2 — Page 15'
            }
          ]
        },
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'art-report-1',
        notebookId: osNotebook.id,
        userId: demoUser.id,
        type: 'report',
        title: 'Technical Study Report: OS Memory Architecture',
        content: {
          reportType: 'Technical',
          executiveSummary: 'This comprehensive technical study reviews contemporary process scheduling and memory management paradigms. We evaluate the trade-offs between preemption models and hardware-assisted translation mechanisms.',
          sections: [
            {
              heading: '1. Introduction & Background',
              content: 'Operating systems serve as the intermediary layer between physical compute hardware and user-space applications. Ensuring equitable processor allocation while isolating memory spaces is essential for multi-tenant system stability.'
            },
            {
              heading: '2. Process Control Architecture',
              content: 'The Process Control Block (PCB) maintains execution context including instruction pointers, register mirrors, and open file descriptors. State transitions between Ready, Running, and Waiting dictate CPU utilization efficiency.'
            },
            {
              heading: '3. Comparative Analysis of CPU Scheduling',
              content: 'While First-Come First-Served guarantees determinism, it suffers from the convoy effect. Round Robin ensures temporal fairness via fixed time quantums, balancing context switch overhead against interactive responsiveness.'
            },
            {
              heading: '4. Memory Virtualization & TLB Performance',
              content: 'Paging decouples logical contiguous memory from physical allocation. The Translation Lookaside Buffer (TLB) mitigates the double-memory-access penalty, sustaining high hit rates in spatial and temporal locality.'
            },
            {
              heading: '5. Conclusion & Recommendations',
              content: 'Modern OS design relies on symbiotic hardware-software coordination: TLB hardware acceleration combined with kernel-level demand paging and priority aging delivers optimal throughput and zero starvation.'
            }
          ],
          references: [
            'Silberschatz, Galvin, Gagne: Operating System Concepts (10th Edition)',
            'OS Unit 1: Process Management & CPU Scheduling, Pages 1-14',
            'OS Unit 2: Memory Management & Virtual Memory, Pages 1-18'
          ]
        },
        createdAt: new Date(Date.now() - 1200000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'art-table-1',
        notebookId: osNotebook.id,
        userId: demoUser.id,
        type: 'data_table',
        title: 'Comparison Table: CPU Scheduling Algorithms',
        content: {
          columns: ['Algorithm', 'Preemptive', 'Time Complexity', 'Convoy Effect Risk', 'Starvation Risk', 'Primary Use Case'],
          rows: [
            ['FCFS (First-Come First-Served)', 'No', 'O(1)', 'High', 'None', 'Batch systems, simple FIFO queues'],
            ['SJF (Shortest Job First)', 'Both (SJF / SRTF)', 'O(n log n)', 'None', 'High for long jobs', 'Long-term job schedulers'],
            ['Round Robin (RR)', 'Yes', 'O(1)', 'Low', 'None', 'Interactive time-sharing systems'],
            ['Priority Scheduling', 'Both', 'O(n log n)', 'Moderate', 'High (mitigated by aging)', 'Real-time and mission-critical systems'],
            ['Multilevel Feedback Queue', 'Yes', 'O(1)', 'None', 'Low', 'General-purpose modern operating systems']
          ]
        },
        createdAt: new Date(Date.now() - 900000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'art-guide-1',
        notebookId: osNotebook.id,
        userId: demoUser.id,
        type: 'study_guide',
        title: 'Comprehensive Exam Study Guide',
        content: {
          checklist: [
            { topic: 'Process States & State Transition Diagram', status: 'completed' },
            { topic: 'PCB Structure & Context Switching Overhead', status: 'completed' },
            { topic: 'Scheduling Criteria: Turnaround vs Waiting Time', status: 'learning' },
            { topic: 'Round Robin Quantum Tuning and Convoy Effect', status: 'learning' },
            { topic: 'Logical vs Physical Address Space and MMU', status: 'completed' },
            { topic: 'Paging Calculations (Page Number and Offset)', status: 'not_started' },
            { topic: 'TLB Hit Ratio & Effective Memory Access Time', status: 'not_started' },
            { topic: 'Page Fault Handling Step-by-Step Sequence', status: 'not_started' }
          ],
          practiceQuestions: [
            'Calculate the effective memory access time given 80% TLB hit ratio and 100ns memory access time.',
            'Explain how aging prevents indefinite blocking in priority scheduling.',
            'Why are page sizes always powers of two in binary architectures?'
          ]
        },
        createdAt: new Date(Date.now() - 600000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'art-defs-1',
        notebookId: osNotebook.id,
        userId: demoUser.id,
        type: 'definitions',
        title: 'Glossary of Core Technical Definitions',
        content: {
          definitions: [
            {
              term: 'Process',
              definition: 'A program in execution, including code, program counter, register values, stack, data section, and dynamic memory heap.',
              sourceRef: 'OS Unit 1 — Page 2'
            },
            {
              term: 'Context Switch',
              definition: 'The operational mechanism of saving the current processor state of a running process and restoring another, representing computational overhead.',
              sourceRef: 'OS Unit 1 — Page 6'
            },
            {
              term: 'Aging',
              definition: 'A technique of gradually increasing the priority of processes that wait in the system for a long time to prevent starvation.',
              sourceRef: 'OS Unit 1 — Page 10'
            },
            {
              term: 'Paging',
              definition: 'A memory-management scheme permitting noncontiguous physical allocation by dividing memory into fixed-size pages and frames.',
              sourceRef: 'OS Unit 2 — Page 7'
            },
            {
              term: 'Translation Lookaside Buffer (TLB)',
              definition: 'A fast associative hardware cache that stores active page table mappings to minimize memory lookup latency.',
              sourceRef: 'OS Unit 2 — Page 11'
            },
            {
              term: 'Demand Paging',
              definition: 'A virtual memory system where secondary storage pages are loaded into RAM only upon active reference.',
              sourceRef: 'OS Unit 2 — Page 15'
            }
          ]
        },
        createdAt: new Date(Date.now() - 300000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    this.data = {
      users: [demoUser],
      notebooks: [osNotebook],
      sources: [source1, source2],
      sourceChunks: chunks,
      conversations: [conversation],
      messages: initialMessages,
      artifacts: demoArtifacts
    };
  }

  // Users
  getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  createUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  // Notebooks
  getNotebooks(userId: string): Notebook[] {
    return this.data.notebooks
      .filter(n => n.userId === userId || n.id === 'demo-nb-os')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  getNotebook(id: string, userId?: string): Notebook | undefined {
    const targetId = id === 'nb-demo-1' ? 'demo-nb-os' : id;
    if (userId) {
      const match = this.data.notebooks.find(n => n.id === targetId && (n.userId === userId || n.id === 'demo-nb-os'));
      if (match) return match;
    }
    return this.data.notebooks.find(n => n.id === targetId);
  }

  createNotebook(notebook: Notebook): Notebook {
    this.data.notebooks.push(notebook);
    this.save();
    return notebook;
  }

  updateNotebook(id: string, userId: string, updates: Partial<Notebook>): Notebook | undefined {
    const nb = this.getNotebook(id, userId);
    if (!nb) return undefined;
    Object.assign(nb, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return nb;
  }

  deleteNotebook(id: string, userId: string): boolean {
    const idx = this.data.notebooks.findIndex(n => n.id === id && n.userId === userId);
    if (idx === -1) return false;
    this.data.notebooks.splice(idx, 1);
    this.data.sources = this.data.sources.filter(s => s.notebookId !== id);
    this.data.sourceChunks = this.data.sourceChunks.filter(sc => sc.notebookId !== id);
    this.data.conversations = this.data.conversations.filter(c => c.notebookId !== id);
    this.data.messages = this.data.messages.filter(m => m.notebookId !== id);
    this.data.artifacts = this.data.artifacts.filter(a => a.notebookId !== id);
    this.save();
    return true;
  }

  private resolveNbId(id: string): string {
    return id === 'nb-demo-1' ? 'demo-nb-os' : id;
  }

  // Sources
  getSources(notebookId: string): Source[] {
    const targetId = this.resolveNbId(notebookId);
    return this.data.sources.filter(s => s.notebookId === targetId);
  }

  getSource(id: string): Source | undefined {
    return this.data.sources.find(s => s.id === id);
  }

  createSource(source: Source): Source {
    this.data.sources.push(source);
    this.save();
    return source;
  }

  updateSource(id: string, updates: Partial<Source>): Source | undefined {
    const src = this.data.sources.find(s => s.id === id);
    if (!src) return undefined;
    Object.assign(src, updates);
    this.save();
    return src;
  }

  deleteSource(id: string): boolean {
    const idx = this.data.sources.findIndex(s => s.id === id);
    if (idx === -1) return false;
    this.data.sources.splice(idx, 1);
    this.data.sourceChunks = this.data.sourceChunks.filter(c => c.sourceId !== id);
    this.save();
    return true;
  }

  // Chunks
  getChunks(notebookId: string, sourceIds?: string[]): SourceChunk[] {
    const targetId = this.resolveNbId(notebookId);
    let chunks = this.data.sourceChunks.filter(c => c.notebookId === targetId);
    if (sourceIds && sourceIds.length > 0) {
      chunks = chunks.filter(c => sourceIds.includes(c.sourceId));
    }
    return chunks;
  }

  saveChunks(chunks: SourceChunk[]) {
    this.data.sourceChunks.push(...chunks);
    this.save();
  }

  deleteChunksForSource(sourceId: string) {
    this.data.sourceChunks = this.data.sourceChunks.filter(c => c.sourceId !== sourceId);
    this.save();
  }

  // Conversations & Chat
  getConversation(notebookId: string, userId: string): Conversation {
    const targetId = this.resolveNbId(notebookId);
    let conv = this.data.conversations.find(c => c.notebookId === targetId && c.userId === userId);
    if (!conv) {
      conv = {
        id: 'conv-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        notebookId: targetId,
        userId,
        title: 'Notebook Chat',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.data.conversations.push(conv);
      this.save();
    }
    return conv;
  }

  getMessages(notebookId: string): ChatMessage[] {
    const targetId = this.resolveNbId(notebookId);
    return this.data.messages
      .filter(m => m.notebookId === targetId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  addMessage(msg: ChatMessage): ChatMessage {
    this.data.messages.push(msg);
    this.save();
    return msg;
  }

  clearMessages(notebookId: string) {
    const targetId = this.resolveNbId(notebookId);
    this.data.messages = this.data.messages.filter(m => m.notebookId !== targetId);
    this.save();
  }

  // Artifacts
  getArtifacts(notebookId: string): Artifact[] {
    const targetId = this.resolveNbId(notebookId);
    return this.data.artifacts
      .filter(a => a.notebookId === targetId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getArtifact(id: string): Artifact | undefined {
    return this.data.artifacts.find(a => a.id === id);
  }

  createArtifact(art: Artifact): Artifact {
    this.data.artifacts.push(art);
    this.save();
    return art;
  }

  updateArtifact(id: string, updates: Partial<Artifact>): Artifact | undefined {
    const art = this.data.artifacts.find(a => a.id === id);
    if (!art) return undefined;
    Object.assign(art, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return art;
  }

  deleteArtifact(id: string): boolean {
    const idx = this.data.artifacts.findIndex(a => a.id === id);
    if (idx === -1) return false;
    this.data.artifacts.splice(idx, 1);
    this.save();
    return true;
  }

  // Notebook stats helper
  getNotebookStats(notebookId: string) {
    const targetId = this.resolveNbId(notebookId);
    const sourcesCount = this.data.sources.filter(s => s.notebookId === targetId).length;
    const artifactsCount = this.data.artifacts.filter(a => a.notebookId === targetId).length;
    return { sourcesCount, artifactsCount };
  }
}

export const db = new Database();
