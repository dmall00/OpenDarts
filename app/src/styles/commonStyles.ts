export const buttonStyles = {
    base: "items-center justify-center rounded-md shadow-md active:shadow-lg active:scale-95 h-14 w-full transition-all duration-75",
    
    variants: {
        number: {
            base: "bg-white border border-slate-200 active:bg-slate-50 active:border-slate-300",
            selected: "",
            text: "text-slate-800",
            textSelected: ""
        },
        action: {
            base: "bg-slate-100 border border-slate-200 active:bg-slate-200",
            selected: "bg-emerald-500 border-emerald-500 active:bg-emerald-600",
            text: "text-slate-700",
            textSelected: "text-white"
        },
        submit: {
            base: "bg-emerald-500 active:bg-emerald-600",
            selected: "",
            text: "text-white",
            textSelected: ""
        },
        double: {
            base: "bg-orange-50 border border-orange-100 active:bg-orange-100 active:border-orange-200",
            selected: "bg-orange-500 border-orange-500 active:bg-orange-600",
            text: "text-orange-600",
            textSelected: "text-white"
        },
        triple: {
            base: "bg-enpmerald-50 border border-enpmerald-100 active:bg-enpmerald-100 active:border-enpmerald-200",
            selected: "bg-enpmerald-500 border-enpmerald-500 active:bg-enpmerald-600",
            text: "text-enpmerald-600",
            textSelected: "text-white"
        },
        back: {
            base: "bg-slate-200 border border-slate-300 active:bg-slate-300 active:border-slate-400",
            selected: "bg-slate-400 border-slate-400 active:bg-slate-500",
            text: "text-slate-700",
            textSelected: "text-white"
        }
    },
    
    text: {
        base: "text-xl font-bold"
    }
};