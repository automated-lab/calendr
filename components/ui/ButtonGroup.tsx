"use client"

import { cn } from "@/lib/utils";
import { ButtonProps } from "./button";
import { cloneElement, ReactElement } from "react";
import { Children } from "react";
interface iAppProps {
    className?: string
    children: ReactElement<ButtonProps>[]
}   


export function ButtonGroup({ className, children }: iAppProps) {
    const totalButtons = Children.count(children)

    return (
        <div className={cn("flex w-full", className)}>
            {children.map ((child, index) => {
                const isFirstItem = index === 0
                const isLastItem = index === totalButtons - 1
                return (
                    cloneElement(child, {
                        className: cn(child.props.className, {
                            "rounded-l-none": !isFirstItem,
                            "rounded-r-none": !isLastItem,
                            "border-l-0": !isFirstItem,
                        }, child.props.className),
                    })
                )
            })}
        </div>
    )
}