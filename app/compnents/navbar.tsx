import Link from "next/link";
import Image from "next/image";
import Logo from "@/public/logo.png";

export function Navbar() {
    return (
    <div className="flex justify-between items-center p-5">
        <Link href="/" className="flex items-center gap-2">
        <Image src={Logo} alt="logo" className="size-10" />
        <h4 className="font-semibold text-xl">
            Calend<span className="text-blue-500">r</span>
        </h4>
        </Link>
        <button className="bg-blue-500 text-white px-4 py-2 rounded-md">Get Started</button>
    </div>
    );
}