export const buttonStyles = {
    base: "items-center justify-center rounded-xl shadow-sm active:opacity-80 min-h-[60px] aspect-square",
    
    variants: {
        number: {
            base: "bg-white border border-slate-200",
            selected: "",
            text: "text-slate-800",
            textSelected: ""
        },
        action: {
            base: "bg-slate-100 border border-slate-200",
            selected: "bg-emerald-500 border-emerald-500",
            text: "text-slate-700",
            textSelected: "text-white"
        },
        submit: {
            base: "bg-emerald-500",
            selected: "",
            text: "text-white",
            textSelected: ""
        },
        double: {
            base: "bg-orange-50 border border-orange-100",
            selected: "bg-orange-500 border-orange-500",
            text: "text-orange-600",
            textSelected: "text-white"
        },
        triple: {
            base: "bg-enpmerald-50 border border-enpmerald-100",
            selected: "bg-enpmerald-500 border-enpmerald-500",
            text: "text-enpmerald-600",
            textSelected: "text-white"
        },
        back: {
            base: "bg-slate-200 border border-slate-300",
            selected: "bg-slate-400 border-slate-400",
            text: "text-slate-700",
            textSelected: "text-white"
        }
    },
    
    text: {
        base: "text-xl font-bold"
    }
};